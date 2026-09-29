# Especificação - Document Management System

## 1. Objetivo

Permitir que cada usuário envie, consulte e baixe seus documentos por meio de uma interface web e de uma API, mantendo os arquivos no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos metadados dos documentos do usuário informado.
- Download de um documento pelo identificador, somente pelo usuário dono.
- Interface web para envio, listagem e download.
- Armazenamento de arquivos local em `backend/storage`, com `multer` e `diskStorage`.
- Metadados mantidos em memória durante a execução do processo.

### Fora do escopo

- Provedores de armazenamento externos ou armazenamento em nuvem.
- Persistência durável de metadados, banco de dados ou recuperação de metadados após reinício.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Cadastro, autenticação e autorização de usuários. O identificador enviado pelo cliente nesta fase é somente uma convenção local, não uma credencial.
- Pré-visualização, pesquisa, paginação e processamento do conteúdo dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo no campo `file` de uma requisição `multipart/form-data`. |
| RF-02 | O sistema deve criar um identificador único e registrar nome original, tamanho, data/hora de envio e dono do documento. |
| RF-03 | O sistema deve listar somente os documentos associados ao usuário da requisição, do mais recente para o mais antigo. |
| RF-04 | O sistema deve permitir o download do arquivo pelo identificador somente ao usuário dono. |
| RF-05 | O sistema deve rejeitar requisições sem identificador de usuário válido. |
| RF-06 | O sistema deve rejeitar upload sem arquivo e limitar o tamanho máximo do arquivo. |
| RF-07 | A interface deve permitir informar o usuário local, selecionar e enviar um arquivo, consultar a lista e baixar um documento. |
| RF-08 | A interface deve apresentar estados de carregamento, lista vazia e erro sem descartar a lista já carregada. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e CommonJS; o frontend deve usar React e Vite com módulos ESM. |
| RNF-02 | O backend deve separar rotas, controllers, services e repositories, com dependências no sentido `routes -> controllers -> services -> repositories`. |
| RNF-03 | Arquivos devem ser gravados exclusivamente no filesystem local com `multer` `diskStorage`; o nome físico deve ser gerado pelo servidor e não derivado do nome enviado pelo cliente. |
| RNF-04 | Os metadados devem permanecer em memória nesta fase. Reiniciar o processo remove os metadados, mesmo que os arquivos ainda permaneçam no disco. |
| RNF-05 | Configurações operacionais devem ser obtidas de variáveis de ambiente, com valores padrão locais documentados abaixo. |
| RNF-06 | Testes do backend devem usar o runner nativo `node:test`. |
| RNF-07 | Mensagens de erro da API devem seguir o formato JSON descrito nos contratos. |
| RNF-08 | O sistema não deve expor o caminho físico do arquivo na resposta da API. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string (UUID) | Identificador único gerado pelo servidor. |
| `originalName` | string | Nome original informado no upload; usado no download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601 UTC) | Data e hora em que o upload foi registrado. |
| `owner` | string | Identificador recebido no cabeçalho `X-User-Id`. |

### Dados internos de armazenamento

O registro mantido pelo repositório também contém o caminho interno (`filePath`) para localizar o arquivo no disco. Esse dado não deve ser serializado nas respostas HTTP. Os arquivos recebem nomes físicos UUID sem extensão e ficam no diretório local configurado.

### Identidade nesta fase

O cabeçalho `X-User-Id` é obrigatório e deve conter uma string não vazia com até 200 caracteres após remover espaços externos. Ele permite exercitar o isolamento por dono no ambiente local, mas pode ser definido pelo próprio cliente; portanto, não fornece autenticação real. A API não deve ser exposta a usuários não confiáveis sem substituir essa convenção por uma identidade autenticada.

## 6. Contratos de API

As rotas do backend são `/upload`, `/documents` e `/documents/:id/download`. No desenvolvimento, o frontend usa o prefixo `/api`, removido pelo proxy do Vite antes de encaminhar as chamadas para o backend.

Todas as rotas de documentos exigem `X-User-Id`.

### `POST /upload`

- Entrada: `multipart/form-data` com um arquivo no campo `file`.
- Sucesso: `201 Created`, corpo com os metadados públicos do documento.
- Erros: `400 Bad Request` se o campo estiver ausente ou inválido; `401 Unauthorized` se `X-User-Id` estiver ausente ou inválido; `413 Payload Too Large` se o arquivo exceder o limite.

Exemplo de resposta `201`:

```json
{
  "id": "d8b96ef5-c730-4bac-8555-48dd12198b93",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": "usuario-local"
}
```

### `GET /documents`

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, corpo como lista de metadados públicos, ordenada do upload mais recente para o mais antigo. Sem documentos, retorna `[]`.
- Erro: `401 Unauthorized` se `X-User-Id` estiver ausente ou inválido.

### `GET /documents/:id/download`

- Entrada: identificador UUID na rota e cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário com `Content-Disposition: attachment` e nome original do arquivo.
- Erros: `401 Unauthorized` se `X-User-Id` estiver ausente ou inválido; `404 Not Found` se o documento não existir, pertencer a outro usuário ou o arquivo local não estiver disponível.

### Formato de erros

Erros JSON usam o formato `{ "error": { "code": "CODIGO", "message": "Descrição em português." } }`. Códigos previstos incluem `USER_REQUIRED`, `FILE_REQUIRED`, `FILE_TOO_LARGE`, `INVALID_UPLOAD`, `DOCUMENT_NOT_FOUND`, `ROUTE_NOT_FOUND` e `INTERNAL_ERROR`.

### Configuração

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local em que os arquivos são gravados. |
| `MAX_FILE_SIZE_BYTES` | `10485760` (10 MiB) | Tamanho máximo permitido por arquivo. |

## 7. Decisões arquiteturais

- `routes/` registra as rotas e aplica o middleware de upload; não implementa regras de negócio.
- `controllers/` valida dados HTTP, obtém a identidade provisória e formata respostas e erros.
- `services/` cria os metadados e aplica os casos de uso de listagem e download.
- `repositories/` mantém os metadados em memória e filtra os documentos pelo dono.
- `multer` com `diskStorage` grava os bytes localmente; nomes físicos são aleatórios para evitar colisões e não confiar em nomes enviados pelo cliente.
- O frontend acessa a API com `fetch` por `/api`; o proxy do Vite direciona as chamadas para o backend local.
- A aplicação mantém o endpoint de saúde `GET /health`.
- A perda dos metadados ao reiniciar e a possibilidade de arquivos órfãos são limitações conhecidas da fase em memória.

## 8. Plano de execução

1. Definir requisitos, identidade provisória, modelo de metadados, contratos HTTP e limites do armazenamento local.
2. Implementar a API pelas camadas de rotas, controllers, services e repositories, incluindo limites e tratamento de erros.
3. Implementar a interface de upload, listagem e download consumindo a API pelo proxy `/api`.
4. Validar os fluxos integrados, isolamento por usuário, limites de upload, estados de erro e build do frontend.

## 9. Critérios de aceite

- Um usuário consegue enviar um arquivo e recebe metadados sem o caminho físico.
- O arquivo é gravado em armazenamento local com nome gerado pelo servidor.
- A listagem contém apenas os documentos do usuário e apresenta `[]` quando não há itens.
- O dono consegue baixar o arquivo original; outro usuário recebe `404` para o mesmo identificador.
- Identidade ausente, arquivo ausente, arquivo acima do limite e documento inexistente produzem os status e formatos documentados.
- Os testes do backend passam e o frontend compila.