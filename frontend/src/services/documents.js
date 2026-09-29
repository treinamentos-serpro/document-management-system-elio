const API_BASE = '/api';

async function getErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a operação.';
  } catch {
    return 'Não foi possível concluir a operação.';
  }
}

async function ensureSuccess(response) {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response;
}

function userHeaders(userId) {
  return { 'X-User-Id': userId };
}

export async function listDocuments(userId) {
  const response = await ensureSuccess(await fetch(`${API_BASE}/documents`, {
    headers: userHeaders(userId),
  }));
  return response.json();
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await ensureSuccess(await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: userHeaders(userId),
    body: formData,
  }));
  return response.json();
}

export async function downloadDocument(userId, document) {
  const response = await ensureSuccess(await fetch(
    `${API_BASE}/documents/${encodeURIComponent(document.id)}/download`,
    { headers: userHeaders(userId) },
  ));
  const objectUrl = URL.createObjectURL(await response.blob());
  const downloadLink = window.document.createElement('a');
  downloadLink.href = objectUrl;
  downloadLink.download = document.originalName;
  downloadLink.click();
  URL.revokeObjectURL(objectUrl);
}