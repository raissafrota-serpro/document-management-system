import { useState } from 'react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ onUploaded }) {
  const [owner, setOwner] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const uploadedDocument = await uploadDocument({
        file: selectedFile,
        owner,
      });

      setSelectedFile(null);
      event.target.reset();

      if (onUploaded) {
        onUploaded(uploadedDocument);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-label="Envio de documento" style={{ marginBottom: '2rem' }}>
      <h2>Enviar documento</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="owner">Dono</label>
          <br />
          <input
            id="owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Ex.: joao"
            style={{ width: '100%', maxWidth: 320 }}
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="file">Arquivo</label>
          <br />
          <input
            id="file"
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {error ? (
        <p role="alert" style={{ color: '#b00020', marginTop: '0.75rem' }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
