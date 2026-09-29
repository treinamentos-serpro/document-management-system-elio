import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documents.js';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('usuario-local');
  const [refreshKey, setRefreshKey] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setError('');

    listDocuments(userId)
      .then((result) => {
        if (isCurrentRequest) setDocuments(result);
      })
      .catch((requestError) => {
        if (isCurrentRequest) setError(requestError.message);
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, refreshKey]);

  function handleError(requestError) {
    setNotice('');
    setError(requestError.message);
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="DMS, início">
          <span className="wordmark-icon" aria-hidden="true">D</span>
          <span>DMS <small>ARQUIVOS</small></span>
        </a>
        <label className="user-field">
          <span>Usuário local</span>
          <input
            aria-label="Identificador do usuário local"
            maxLength={200}
            onChange={(event) => setUserId(event.target.value)}
            value={userId}
          />
        </label>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">ARQUIVO PESSOAL</p>
          <h1>Documentos</h1>
          <p className="heading-note">Seus arquivos, em um só lugar.</p>
        </div>
        <div className="document-count" aria-live="polite">
          <span>{documents.length.toString().padStart(2, '0')}</span>
          <small>{documents.length === 1 ? 'documento' : 'documentos'}</small>
        </div>
      </section>

      <section className="upload-section" aria-labelledby="upload-heading">
        <div className="section-title">
          <span className="section-index">01</span>
          <h2 id="upload-heading">Adicionar arquivo</h2>
        </div>
        <UploadComponent
          onError={handleError}
          onUploaded={(uploadedDocument) => {
            setError('');
            setNotice('Documento enviado.');
            setDocuments((currentDocuments) => [uploadedDocument, ...currentDocuments]);
          }}
          userId={userId}
        />
      </section>

      <section className="documents-section" aria-labelledby="documents-heading">
        <div className="section-title documents-title">
          <span className="section-index">02</span>
          <h2 id="documents-heading">Arquivos enviados</h2>
          <button
            aria-label="Atualizar lista de documentos"
            className="refresh-button"
            onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
            title="Atualizar lista"
            type="button"
          >
            ↻
          </button>
        </div>

        {error && <p className="feedback error-message" role="alert">{error}</p>}
        {notice && <p className="feedback success-message" role="status">{notice}</p>}

        <DocumentList
          documents={documents}
          isLoading={isLoading}
          onError={handleError}
          userId={userId}
        />
      </section>
      <footer className="page-footer">ARMAZENAMENTO LOCAL <span>·</span> DMS</footer>
    </main>
  );
}