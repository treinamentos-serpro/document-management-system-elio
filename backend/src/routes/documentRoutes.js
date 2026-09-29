const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');

function createDocumentRoutes(controller, options) {
  fs.mkdirSync(options.storageDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: options.storageDir,
    filename: (req, file, callback) => {
      callback(null, randomUUID());
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: options.maxFileSize },
  });
  const router = express.Router();

  router.post('/upload', controller.requireUser, upload.single('file'), controller.upload);
  router.get('/documents', controller.requireUser, controller.list);
  router.get('/documents/:id/download', controller.requireUser, controller.download);

  return router;
}

module.exports = { createDocumentRoutes };