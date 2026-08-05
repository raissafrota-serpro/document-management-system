const fs = require('fs');
const documentService = require('../services/documentService');

function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo não enviado.' });
  }

  const owner = req.body?.owner?.trim() || 'anonymous';
  const document = documentService.createDocumentMetadata(req.file, owner);

  return res.status(201).json(document);
}

function listDocuments(req, res) {
  const documents = documentService.listDocuments();
  return res.json(documents);
}

function downloadDocument(req, res) {
  const { id } = req.params;
  const fileToDownload = documentService.getDocumentDownloadById(id);

  if (!fileToDownload) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  if (!fs.existsSync(fileToDownload.filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado no armazenamento local.' });
  }

  return res.download(fileToDownload.filePath, fileToDownload.downloadName);
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
