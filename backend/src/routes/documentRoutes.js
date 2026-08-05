const express = require('express');
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.resolve(__dirname, '../../storage'));
  },
  filename(req, file, cb) {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${uniquePrefix}-${sanitizedOriginalName}`);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
