const path = require('path');
const { randomUUID } = require('crypto');
const documentRepository = require('../repositories/documentRepository');

function createDocumentMetadata(file, owner) {
  const documentMetadata = {
    id: randomUUID(),
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  };

  return documentRepository.save(documentMetadata);
}

function listDocuments() {
  return documentRepository.findAll().map((document) => ({
    id: document.id,
    originalName: document.originalName,
    mimeType: document.mimeType,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  }));
}

function getDocumentDownloadById(id) {
  const document = documentRepository.findById(id);

  if (!document) {
    return null;
  }

  return {
    filePath: path.resolve(document.storagePath),
    downloadName: document.originalName,
    mimeType: document.mimeType,
  };
}

module.exports = {
  createDocumentMetadata,
  listDocuments,
  getDocumentDownloadById,
};
