const documentService = require('../services/documentService');

function uploadDocument(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo não enviado.' });
  }

  try {
    const owner = req.body?.owner;
    const document = documentService.createDocumentMetadata(req.file, owner);

    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function listDocuments(req, res, next) {
  try {
    const documents = documentService.listDocuments();
    return res.json(documents);
  } catch (error) {
    return next(error);
  }
}

function downloadDocument(req, res, next) {
  const { id } = req.params;
  const fileToDownload = documentService.getDocumentDownloadById(id);

  if (!fileToDownload) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  res.type(fileToDownload.mimeType);

  return res.download(fileToDownload.filePath, fileToDownload.downloadName, (error) => {
    if (!error) {
      return;
    }

    if (res.headersSent) {
      return next(error);
    }

    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Arquivo não encontrado no armazenamento local.' });
    }

    return next(error);
  });
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
