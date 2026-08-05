import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const fetchedDocuments = await listDocuments();
      setDocuments(fetchedDocuments);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
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
