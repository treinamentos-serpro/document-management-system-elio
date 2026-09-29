import { useState } from 'react';
import { downloadDocument } from '../services/documents.js';

export default function DownloadButton({ document, userId, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadDocument(userId, document);
    } catch (requestError) {
      onError(requestError);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      className="download-button"
      disabled={isDownloading}
      onClick={handleDownload}
      type="button"
    >
      {isDownloading ? 'Baixando…' : 'Baixar'}
      <span aria-hidden="true">↓</span>
    </button>
  );
}