function publicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocumentController(service) {
  function requireUser(req, res, next) {
    const owner = req.get('X-User-Id')?.trim();
    if (!owner || owner.length > 200) {
      res.status(401).json({
        error: { code: 'USER_REQUIRED', message: 'Informe um usuário válido.' },
      });
      return;
    }

    req.owner = owner;
    next();
  }

  return {
    requireUser,

    upload(req, res) {
      if (!req.file) {
        res.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo "file".' },
        });
        return;
      }

      const document = service.registerUpload(req.file, req.owner);
      res.status(201).json(publicDocument(document));
    },

    list(req, res) {
      res.json(service.listDocuments(req.owner).map(publicDocument));
    },

    download(req, res, next) {
      const document = service.findDocumentForDownload(req.params.id, req.owner);
      if (!document) {
        res.status(404).json({
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
        });
        return;
      }

      res.download(document.filePath, document.originalName, (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      });
    },
  };
}

module.exports = { createDocumentController };