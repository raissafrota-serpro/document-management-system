import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async (signal) => {
    if (!signal?.aborted) {
      setIsLoading(true);
      setError('');
    }

    try {
      const fetchedDocuments = await listDocuments({ signal });

      if (!signal?.aborted) {
        setDocuments(fetchedDocuments);
      }
    } catch (loadError) {
      if (loadError?.name !== 'AbortError' && !signal?.aborted) {
        setError(loadError.message);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDocuments]);

  async function handleUploaded() {
    await loadDocuments();
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 840, margin: '0 auto' }}>
      <h1>Document Management System</h1>

      <UploadComponent onUploaded={handleUploaded} />

      {isLoading ? <p>Carregando documentos...</p> : null}
      {error ? (
        <p role="alert" style={{ color: '#b00020' }}>
          {error}
        </p>
      ) : null}
      {!isLoading && !error ? <DocumentList documents={documents} /> : null}
    </main>
  );
}
