const { randomUUID } = require('node:crypto');

function createDocumentService(repository) {
  return {
    registerUpload(file, owner) {
      return repository.add({
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        filePath: file.path,
      });
    },

    listDocuments(owner) {
      return repository.listByOwner(owner);
    },

    findDocumentForDownload(id, owner) {
      return repository.findByIdAndOwner(id, owner);
    },
  };
}

module.exports = { createDocumentService };