const { before, beforeEach, after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

const storageDir = path.resolve(__dirname, '../storage');

let server;
let baseUrl;

function clearStorage() {
  if (!fs.existsSync(storageDir)) {
    return;
  }

  for (const fileName of fs.readdirSync(storageDir)) {
    fs.rmSync(path.join(storageDir, fileName), { force: true, recursive: true });
  }
}

async function parseJson(response) {
  const bodyText = await response.text();
  return bodyText ? JSON.parse(bodyText) : {};
}

async function uploadFixture(options = {}) {
  const owner = Object.prototype.hasOwnProperty.call(options, 'owner') ? options.owner : 'qa-user';
  const fileName = options.fileName || 'sample.txt';
  const content = options.content || 'hello world';
  const formData = new FormData();
  const file = new File([content], fileName, { type: 'text/plain' });

  formData.append('file', file, fileName);
  if (owner !== undefined) {
    formData.append('owner', owner);
  }

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  const payload = await parseJson(response);
  return { response, payload };
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

beforeEach(() => {
  documentRepository.clear();
  clearStorage();
});

after(async () => {
  clearStorage();

  await new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

test('GET /health responde com status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const payload = await parseJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { status: 'ok' });
});

test('GET /documents retorna lista vazia quando não há documentos', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  const payload = await parseJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(payload, []);
});

test('POST /upload retorna 400 quando arquivo não é enviado', async () => {
  const formData = new FormData();
  formData.append('owner', 'qa-user');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  const payload = await parseJson(response);

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Arquivo não enviado.');
});

test('POST /upload retorna 400 quando owner está ausente', async () => {
  const { response, payload } = await uploadFixture({ owner: undefined });

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'O campo owner é obrigatório.');
});

test('POST /upload retorna 400 quando owner está vazio', async () => {
  const { response, payload } = await uploadFixture({ owner: '   ' });

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'O campo owner é obrigatório.');
});

test('POST /upload salva arquivo e retorna apenas metadados públicos', async () => {
  const { response, payload } = await uploadFixture({ owner: 'alice' });

  assert.equal(response.status, 201);
  assert.ok(payload.id);
  assert.equal(payload.owner, 'alice');
  assert.equal(payload.originalName, 'sample.txt');
  assert.equal(typeof payload.size, 'number');
  assert.ok(payload.uploadedAt);
  assert.equal(payload.mimeType, 'text/plain');
  assert.equal(payload.storagePath, undefined);
  assert.equal(payload.filename, undefined);

  const storedFiles = fs.readdirSync(storageDir);
  assert.equal(storedFiles.length, 1);
});

test('POST /upload seguido de GET /documents inclui o documento enviado', async () => {
  const uploadResult = await uploadFixture({ owner: 'alice', fileName: 'contrato.txt' });

  const response = await fetch(`${baseUrl}/documents`);
  const payload = await parseJson(response);

  assert.equal(response.status, 200);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].id, uploadResult.payload.id);
  assert.equal(payload[0].owner, 'alice');
  assert.equal(payload[0].originalName, 'contrato.txt');
});

test('POST /upload sanitiza nome perigoso e evita traversal no storage local', async () => {
  const { response, payload } = await uploadFixture({
    owner: 'alice',
    fileName: '../../sensitive.txt',
  });

  assert.equal(response.status, 201);
  assert.equal(payload.originalName, 'sensitive.txt');

  const storedFiles = fs.readdirSync(storageDir);
  assert.equal(storedFiles.length, 1);
  assert.equal(storedFiles[0].includes('..'), false);
});

test('GET /documents lista documentos sem dados internos', async () => {
  await uploadFixture({ owner: 'alice', fileName: 'a.txt' });
  await uploadFixture({ owner: 'bob', fileName: 'b.txt' });

  const response = await fetch(`${baseUrl}/documents`);
  const payload = await parseJson(response);

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(payload), true);
  assert.equal(payload.length, 2);
  assert.equal(payload[0].storagePath, undefined);
  assert.equal(payload[0].filename, undefined);
});

test('GET /documents/:id/download retorna binário do arquivo quando id existe', async () => {
  const uploadResult = await uploadFixture({ owner: 'alice', content: 'conteudo do arquivo' });
  const documentId = uploadResult.payload.id;

  const response = await fetch(`${baseUrl}/documents/${documentId}/download`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(body, 'conteudo do arquivo');
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.match(
    response.headers.get('content-disposition') || '',
    /attachment;\s*filename="sample\.txt"/,
  );
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/id-inexistente/download`);
  const payload = await parseJson(response);

  assert.equal(response.status, 404);
  assert.equal(payload.error, 'Documento não encontrado.');
});

test('GET /documents/:id/download retorna 404 para metadado com caminho fora do storage', async () => {
  documentRepository.save({
    id: 'outside-file',
    originalName: 'fora.txt',
    mimeType: 'text/plain',
    size: 4,
    uploadedAt: new Date().toISOString(),
    owner: 'alice',
    filename: 'fora.txt',
    storagePath: '/etc/passwd',
  });

  const response = await fetch(`${baseUrl}/documents/outside-file/download`);
  const payload = await parseJson(response);

  assert.equal(response.status, 404);
  assert.equal(payload.error, 'Documento não encontrado.');
});
