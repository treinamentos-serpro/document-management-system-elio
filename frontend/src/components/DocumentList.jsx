import DownloadButton from './DownloadButton.jsx';
import { formatDate, formatSize } from './documentFormatting.js';

export default function DocumentList({ documents, isLoading, userId, onError }) {
  return (
    <div className="document-list" aria-live="polite">
      {isLoading ? (
        <p className="list-state">Carregando documentos…</p>
      ) : documents.length === 0 ? (
        <p className="list-state">Nenhum documento para este usuário.</p>
      ) : documents.map((document) => (
        <article className="document-row" key={document.id}>
          <div className="document-mark" aria-hidden="true">DOC</div>
          <div className="document-details">
            <h3 title={document.originalName}>{document.originalName}</h3>
            <p>{formatDate(document.uploadedAt)} <span>·</span> {formatSize(document.size)}</p>
          </div>
          <DownloadButton document={document} onError={onError} userId={userId} />
        </article>
      ))}
    </div>
  );
}