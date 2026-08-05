import DownloadButton from './DownloadButton';

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(1)} MB`;
}

function formatDate(isoDate) {
  if (!isoDate) {
    return '-';
  }

  return new Date(isoDate).toLocaleString('pt-BR');
}

export default function DocumentList({ documents }) {
  return (
    <section aria-label="Lista de documentos">
      <h2>Documentos</h2>

      {documents.length === 0 ? (
        <p>Nenhum documento enviado ainda.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {documents.map((document) => (
            <li
              key={document.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '0.75rem',
              }}
            >
              <p style={{ margin: '0 0 0.5rem' }}>
                <strong>{document.originalName}</strong>
              </p>
              <p style={{ margin: '0 0 0.25rem' }}>
                Dono: {document.owner || 'anonymous'}
              </p>
              <p style={{ margin: '0 0 0.25rem' }}>
                Tamanho: {formatFileSize(document.size)}
              </p>
              <p style={{ margin: '0 0 0.75rem' }}>
                Enviado em: {formatDate(document.uploadedAt)}
              </p>

              <DownloadButton documentId={document.id} fileName={document.originalName} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
