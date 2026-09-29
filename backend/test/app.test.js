const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

async function withServer(options, callback) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = app.createApp({ storageDir, ...options }).listen(0);
  const address = await new Promise((resolve) => {
    server.once('listening', () => resolve(server.address()));
  });

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  }
}

test('faz upload, lista e baixa documento somente para o dono', async () => {
  await withServer({}, async (baseUrl) => {
    const formData = new FormData();
    formData.append('file', new Blob(['conteúdo do documento']), 'relatorio.txt');
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: formData,
    });

    assert.strictEqual(uploadResponse.status, 201);
    const uploadedDocument = await uploadResponse.json();
    assert.strictEqual(uploadedDocument.originalName, 'relatorio.txt');
    assert.strictEqual(uploadedDocument.owner, 'usuario-a');
    assert.strictEqual(uploadedDocument.size, 22);
    assert.ok(uploadedDocument.id);
    assert.ok(uploadedDocument.uploadedAt);

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-a' },
    });
    assert.deepStrictEqual(await listResponse.json(), [uploadedDocument]);

    const downloadResponse = await fetch(
      `${baseUrl}/documents/${uploadedDocument.id}/download`,
      { headers: { 'X-User-Id': 'usuario-a' } },
    );
    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(await downloadResponse.text(), 'conteúdo do documento');

    const otherUserList = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-b' },
    });
    assert.deepStrictEqual(await otherUserList.json(), []);

    const otherUserDownload = await fetch(
      `${baseUrl}/documents/${uploadedDocument.id}/download`,
      { headers: { 'X-User-Id': 'usuario-b' } },
    );
    assert.strictEqual(otherUserDownload.status, 404);
  });
});

test('valida identidade, arquivo obrigatório e limite de tamanho', async () => {
  await withServer({ maxFileSize: 4 }, async (baseUrl) => {
    const unauthorizedResponse = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(unauthorizedResponse.status, 401);

    const missingFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: new FormData(),
    });
    assert.strictEqual(missingFileResponse.status, 400);

    const formData = new FormData();
    formData.append('file', new Blob(['grande']), 'arquivo.txt');
    const oversizedResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: formData,
    });
    assert.strictEqual(oversizedResponse.status, 413);
    assert.strictEqual((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
  });
});
