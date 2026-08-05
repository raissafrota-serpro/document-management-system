const path = require('path');
const { randomUUID } = require('crypto');
const documentRepository = require('../repositories/documentRepository');

const STORAGE_DIR = path.resolve(__dirname, '../../storage');
const MAX_OWNER_LENGTH = 120;
function createBadRequestError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function sanitizeOriginalName(originalName) {
  const baseName = path.basename(originalName || 'document');
  const sanitized = baseName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/g, '')
    .replace(/_+/g, '_')
    .slice(0, 120);

  return sanitized || 'document';
}

function buildPublicMetadata(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    mimeType: document.mimeType,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocumentMetadata(file, ownerInput) {
  const owner = typeof ownerInput === 'string' ? ownerInput.trim() : '';

  if (!owner) {
    throw createBadRequestError('O campo owner é obrigatório.');
  }

  if (owner.length > MAX_OWNER_LENGTH) {
    throw createBadRequestError(`O campo owner deve ter no máximo ${MAX_OWNER_LENGTH} caracteres.`);
  }

  const documentMetadata = {
    id: randomUUID(),
    originalName: sanitizeOriginalName(file.originalname),
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  };

  const savedDocument = documentRepository.save(documentMetadata);
  return buildPublicMetadata(savedDocument);
}

function listDocuments() {
  return documentRepository.findAll().map((document) => buildPublicMetadata(document));
}

function getDocumentDownloadById(id) {
  const document = documentRepository.findById(id);

  if (!document) {
    return null;
  }

  const resolvedPath = path.resolve(document.storagePath);
  const isInsideStorage = resolvedPath === STORAGE_DIR || resolvedPath.startsWith(`${STORAGE_DIR}${path.sep}`);

  if (!isInsideStorage) {
    return null;
  }

  return {
    filePath: resolvedPath,
    downloadName: document.originalName,
    mimeType: document.mimeType,
  };
}

module.exports = {
  createDocumentMetadata,
  listDocuments,
  getDocumentDownloadById,
};
