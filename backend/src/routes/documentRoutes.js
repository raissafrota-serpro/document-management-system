const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');

const STORAGE_DIR = path.resolve(__dirname, '../../storage');
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const parsedMaxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES || '', 10);
const MAX_FILE_SIZE_BYTES = Number.isFinite(parsedMaxFileSize) && parsedMaxFileSize > 0
  ? parsedMaxFileSize
  : DEFAULT_MAX_FILE_SIZE_BYTES;

const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || '')
  .split(',')
  .map((mimeType) => mimeType.trim())
  .filter(Boolean);

fs.mkdirSync(STORAGE_DIR, { recursive: true });

function sanitizeFilename(originalName) {
  const baseName = path.basename(originalName || 'document');
  const normalizedName = baseName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/g, '')
    .replace(/_+/g, '_')
    .slice(0, 120);

  return normalizedName || 'document';
}

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.length === 0 || ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  const error = new Error('Tipo de arquivo não permitido.');
  error.statusCode = 400;
  cb(error);
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, STORAGE_DIR);
  },
  filename(req, file, cb) {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginalName = sanitizeFilename(file.originalname);
    cb(null, `${uniquePrefix}-${sanitizedOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
});
const router = express.Router();

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
