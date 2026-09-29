import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documents.js';
import { formatSize } from './documentFormatting.js';

export default function UploadComponent({ userId, onUploaded, onError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      onError(new Error('Selecione um arquivo para enviar.'));
      return;
    }

    setIsUploading(true);
    try {
      const uploadedDocument = await uploadDocument(userId, selectedFile);
      onUploaded(uploadedDocument);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (requestError) {
      onError(requestError);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker">
        <span className="file-symbol" aria-hidden="true">＋</span>
        <span className="file-label">
          <strong>{selectedFile ? selectedFile.name : 'Escolher um arquivo'}</strong>
          <small>{selectedFile ? formatSize(selectedFile.size) : 'Qualquer formato · até 10 MB'}</small>
        </span>
        <input
          ref={fileInputRef}
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          type="file"
        />
      </label>
      <button className="primary-button" disabled={isUploading || !userId.trim()} type="submit">
        {isUploading ? 'Enviando…' : 'Enviar arquivo'}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}