const API_PREFIX = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    let errorMessage = 'Erro ao processar requisicao.';

    try {
      const payload = await response.json();
      errorMessage = payload?.error || errorMessage;
    } catch {
      // Ignora erros de parsing e usa mensagem padrao.
    }

    throw new Error(errorMessage);
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function uploadDocument({ file, owner }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner', owner?.trim() || 'anonymous');

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

function extractFilename(dispositionHeader, fallbackName) {
  const match = dispositionHeader?.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);

  if (!match?.[1]) {
    return fallbackName;
  }

  const rawName = match[1].trim().replace(/\"/g, '');

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export async function downloadDocument(documentId, fallbackName = 'documento') {
  const response = await request(`/documents/${documentId}/download`);
  const blob = await response.blob();
  const filename = extractFilename(response.headers.get('content-disposition'), fallbackName);

  return { blob, filename };
}
