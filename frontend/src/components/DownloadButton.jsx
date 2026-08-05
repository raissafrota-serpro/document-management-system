import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

function triggerDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function DownloadButton({ documentId, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    try {
      const { blob, filename } = await downloadDocument(documentId, fileName);
      triggerDownload(blob, filename || fileName);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Download'}
      </button>
      {error ? (
        <p role="alert" style={{ color: '#b00020', marginTop: '0.5rem' }}>
          {error}
        </p>
      ) : null}
    </>
  );
}
