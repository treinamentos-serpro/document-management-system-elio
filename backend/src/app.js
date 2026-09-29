const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRoutes } = require('./routes/documentRoutes');

const PORT = process.env.PORT || 3000;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

function getMaxFileSize() {
  const configuredValue = Number(process.env.MAX_FILE_SIZE_BYTES);
  return Number.isSafeInteger(configuredValue) && configuredValue > 0
    ? configuredValue
    : DEFAULT_MAX_FILE_SIZE;
}

function createApp(options = {}) {
  const storageDir = options.storageDir
    || process.env.STORAGE_DIR
    || path.join(__dirname, '..', 'storage');
  const maxFileSize = options.maxFileSize || getMaxFileSize();
  const repository = createDocumentRepository();
  const service = createDocumentService(repository);
  const controller = createDocumentController(service);
  const app = express();

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentRoutes(controller, { storageDir, maxFileSize }));
  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada.' },
    });
  });
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      res.status(tooLarge ? 413 : 400).json({
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
          message: tooLarge
            ? 'O arquivo excede o tamanho máximo permitido.'
            : 'Não foi possível processar o arquivo enviado.',
        },
      });
      return;
    }

    if (error.code === 'ENOENT') {
      res.status(404).json({
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
      });
      return;
    }

    console.error('Erro ao processar requisição:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
