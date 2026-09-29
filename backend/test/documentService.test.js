const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDocumentService } = require('../src/services/documentService');

test('registerUpload cria os metadados e os envia ao repositório', () => {
  let savedDocument;
  const repository = {
    add(document) {
      savedDocument = document;
      return document;
    },
  };
  const service = createDocumentService(repository);
  const file = {
    originalname: 'relatorio.txt',
    size: 42,
    path: '/storage/relatorio',
  };

  const result = service.registerUpload(file, 'usuario-a');

  assert.strictEqual(result, savedDocument);
  assert.deepStrictEqual(
    {
      originalName: savedDocument.originalName,
      size: savedDocument.size,
      owner: savedDocument.owner,
      filePath: savedDocument.filePath,
    },
    {
      originalName: 'relatorio.txt',
      size: 42,
      owner: 'usuario-a',
      filePath: '/storage/relatorio',
    },
  );
  assert.match(savedDocument.id, /^[0-9a-f-]{36}$/i);
  assert.strictEqual(new Date(savedDocument.uploadedAt).toISOString(), savedDocument.uploadedAt);
});

test('operações de leitura delegam ao repositório com os argumentos recebidos', () => {
  const calls = [];
  const repository = {
    listByOwner(owner) {
      calls.push(['listByOwner', owner]);
      return [];
    },
    findByIdAndOwner(id, owner) {
      calls.push(['findByIdAndOwner', id, owner]);
      return null;
    },
  };
  const service = createDocumentService(repository);

  assert.deepStrictEqual(service.listDocuments('usuario-a'), []);
  assert.strictEqual(service.findDocumentForDownload('documento-1', 'usuario-a'), null);
  assert.deepStrictEqual(calls, [
    ['listByOwner', 'usuario-a'],
    ['findByIdAndOwner', 'documento-1', 'usuario-a'],
  ]);
});