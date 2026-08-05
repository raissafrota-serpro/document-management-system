# Especificação - Document Management System (DMS)

## 1. Objetivo

Entregar um sistema web simples para gestão de documentos com upload, listagem e download por identificador, usando armazenamento local de arquivos e metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (campo owner)
- Backend em Clean Architecture simples
- Frontend React consumindo API via prefixo /api

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Banco de dados nesta fase
- Autenticação/autorização completa
- Edição ou remoção de documentos

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um documento via `POST /upload` usando `multipart/form-data`. |
| RF-02 | O backend deve salvar o arquivo enviado no filesystem local em `backend/storage` via `multer` com `diskStorage`. |
| RF-03 | O sistema deve gerar um identificador único para cada documento enviado. |
| RF-04 | O sistema deve registrar metadados do documento em memória. |
| RF-05 | O endpoint de upload deve retornar os metadados do documento criado. |
| RF-06 | O usuário pode listar todos os documentos via `GET /documents`. |
| RF-07 | O usuário pode baixar um documento por identificador via `GET /documents/:id/download`. |
| RF-08 | O sistema deve retornar `404` quando o documento solicitado para download não existir. |
| RF-09 | O sistema deve validar arquivo obrigatório e owner obrigatório no upload. |
| RF-10 | O frontend deve permitir upload, listagem e download consumindo o backend via `/api`. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquitetura backend em camadas: `routes -> controllers -> services -> repositories`. |
| RNF-02 | Armazenamento de arquivos estritamente local com `multer` + `diskStorage`. |
| RNF-03 | Metadados em memória nesta fase inicial. |
| RNF-04 | Configuração por variáveis de ambiente (12-Factor), incluindo `PORT`. |
| RNF-05 | Código em JavaScript (Node.js/Express no backend e React no frontend). |
| RNF-06 | Tratamento de erro nas fronteiras HTTP e leitura de arquivo. |
| RNF-07 | Testes automatizados no backend com `node:test`. |
| RNF-08 | Preservar endpoint de saúde `GET /health`. |

## 5. Modelo de dados (metadados do documento)

### Entidade: DocumentMetadata

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| id | string | Sim | Identificador único do documento |
| originalName | string | Sim | Nome original do arquivo enviado |
| size | number | Sim | Tamanho do arquivo em bytes |
| uploadedAt | string (ISO 8601) | Sim | Data/hora do upload |
| owner | string | Sim | Identificador simples do usuário dono |

### Campos internos de suporte (não expostos no contrato público)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| filePath | string | Caminho absoluto/local do arquivo salvo no storage |
| mimeType | string | Tipo MIME do arquivo para resposta de download |

### Regras do modelo

- `id` deve ser único por documento.
- `uploadedAt` é gerado no backend no momento do upload.
- `size` deve refletir o tamanho real gravado.
- `owner` deve ser informado no upload.
- Reiniciar a aplicação limpa os metadados em memória (comportamento esperado nesta fase).

## 6. Contratos de API

### 6.1 POST /upload

- Objetivo: receber arquivo e registrar documento.
- Content-Type: `multipart/form-data`.
- Entrada:
  - Campo de arquivo: `file`
  - Campo textual: `owner`

#### Resposta de sucesso

- Status: `201 Created`
- Body:

```json
{
  "id": "c2cbf6f2-a047-4fcf-8d73-7f0da37d89f2",
  "originalName": "contrato.pdf",
  "size": 124578,
  "uploadedAt": "2026-08-05T13:20:00.000Z",
  "owner": "user-123"
}
```

#### Erros esperados

- `400 Bad Request`: arquivo ausente
- `400 Bad Request`: owner ausente/vazio
- `500 Internal Server Error`: falha inesperada de processamento

---

### 6.2 GET /documents

- Objetivo: listar metadados de documentos enviados.
- Entrada: sem body.

#### Resposta de sucesso

- Status: `200 OK`
- Body:

```json
[
  {
    "id": "c2cbf6f2-a047-4fcf-8d73-7f0da37d89f2",
    "originalName": "contrato.pdf",
    "size": 124578,
    "uploadedAt": "2026-08-05T13:20:00.000Z",
    "owner": "user-123"
  }
]
```

#### Erros esperados

- `500 Internal Server Error`: falha inesperada de listagem

---

### 6.3 GET /documents/:id/download

- Objetivo: baixar o conteúdo binário de um documento.
- Entrada:
  - Path param: `id`

#### Resposta de sucesso

- Status: `200 OK`
- Headers esperados:
  - `Content-Disposition` com nome original do arquivo
  - `Content-Type` compatível com o MIME do documento
- Body: binário do arquivo

#### Erros esperados

- `404 Not Found`: id inexistente
- `404 Not Found`: metadado existe mas arquivo físico não foi encontrado
- `500 Internal Server Error`: falha inesperada de download

---

### 6.4 GET /health

- Objetivo: verificação de saúde da aplicação.

#### Resposta de sucesso

- Status: `200 OK`
- Body:

```json
{
  "status": "ok"
}
```

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples com separação clara de responsabilidades:
  - `routes/`: define endpoints e aplica middlewares de rota
  - `controllers/`: traduz entrada/saída HTTP e validação básica
  - `services/`: regras de negócio
  - `repositories/`: persistência de metadados em memória
- Fluxo obrigatório de dependência: `routes -> controllers -> services -> repositories`.
- Upload local exclusivamente com `multer` e `diskStorage` em `backend/storage`.
- Frontend em componentes React com camada de serviço dedicada para chamadas `fetch`.
- Proxy do Vite usa prefixo `/api` para integração local backend/frontend.

## 8. Plano de execução em etapas

### Etapa 1 - Estruturação do backend por camadas

- Criar módulos de `routes`, `controllers`, `services` e `repositories`.
- Integrar rotas de documentos no app Express.
- Preservar endpoint `GET /health`.

Critério de aceite:

- Aplicação sobe sem erros com camadas conectadas.

### Etapa 2 - Upload com armazenamento local

- Configurar `multer` com `diskStorage` para salvar em `backend/storage`.
- Implementar `POST /upload`.
- Validar arquivo e owner obrigatórios.

Critérios de aceite:

- Upload retorna `201` com metadados esperados.
- Arquivo existe fisicamente no storage.

### Etapa 3 - Listagem e download

- Implementar `GET /documents` com metadados em memória.
- Implementar `GET /documents/:id/download` com validação de existência.

Critérios de aceite:

- Listagem retorna array de metadados.
- Download retorna arquivo quando id existe.
- Download retorna `404` para id inexistente.

### Etapa 4 - Testes backend

- Cobrir com testes automatizados os fluxos:
  - health
  - upload sucesso
  - upload inválido
  - listagem
  - download sucesso
  - download com id inválido

Critério de aceite:

- Suíte de testes do backend executa sem falhas.

### Etapa 5 - Frontend funcional

- Implementar componente de upload.
- Implementar componente de listagem.
- Implementar ação de download por item.
- Criar serviço de API via `fetch` com `/api`.

Critério de aceite:

- Fluxo completo funcionando pela interface: upload -> listar -> baixar.

### Etapa 6 - Validação final

- Validar build do frontend.
- Validar testes backend.
- Confirmar aderência à arquitetura e restrições.

Critério de aceite:

- Solução pronta para revisão com requisitos atendidos.

## 9. Riscos e limitações conhecidas

- Metadados em memória são perdidos ao reiniciar a aplicação.
- Sem autenticação robusta nesta fase, owner é informativo.
- Sem estratégia de escalabilidade horizontal para storage local.

## 10. Evoluções futuras (fora do escopo atual)

- Persistência de metadados em banco de dados.
- Autenticação e autorização completas.
- Exclusão e atualização de documentos.
- Paginação e filtros na listagem.
- Observabilidade (logs estruturados, métricas e tracing).
