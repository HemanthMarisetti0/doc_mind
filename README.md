# DocMind

Chat with your documents. Upload PDFs, Word files and text files, organize them into collections, and ask questions. An AI agent answers from your own documents and cites its sources.

Built with **React + Vite** on the frontend and **NestJS + Prisma + PostgreSQL/pgvector** on the backend. It uses **Gemini** for chat and embeddings and **Supabase** for the database and file storage.

## Features

- **Auth:** email/password sign-up and **Sign in with Google** (JWT sessions).
- **Document upload:** PDF, DOCX and TXT. Text is extracted, chunked, embedded and stored in pgvector in the background.
- **Collections:** group documents (e.g. "HR", "Contracts") and limit a chat to one collection or one document.
- **AI agent chat:** a Gemini function-calling agent with tools (`search_documents`, `search_collection`, `get_document`) that decides where to look before answering.
- **Cited answers:** responses link back to the document chunks they came from.
- **Semantic search:** cosine-similarity search over your chunks (HNSW index).
- **Dashboard and settings:** usage stats, profile, and light/dark theme.

## How it works

```
Upload ──► Supabase Storage
   │
   └─► extract text (pdf-parse / mammoth) ─► chunk ─► Gemini embeddings ─► pgvector

Question ──► Agent (Gemini + tools) ──► vector search over your chunks ──► answer + citations
```

## Project structure

```
docmind/
├── backend/            NestJS API
│   ├── prisma/         schema + migrations (enables the pgvector extension)
│   └── src/
│       ├── auth/            JWT + Google OAuth
│       ├── documents/       upload, text extraction, chunking, processing queue
│       ├── embeddings/      Gemini embeddings
│       ├── vector-search/   pgvector similarity search
│       ├── agent/           function-calling agent and its tools
│       ├── rag/             single-shot RAG endpoint
│       ├── conversations/   chat threads and messages
│       ├── collections/     document groups
│       ├── storage/         Supabase Storage wrapper
│       └── users/           profile + stats
└── frontend/           React + Vite + TanStack Query + Tailwind
    └── src/{pages,components,hooks,api,context}
```

## Prerequisites

- **Node.js** 20+ (developed on 24)
- **pnpm** (`npm i -g pnpm`)
- A **Supabase** project (Postgres + Storage)
- A **Gemini API key**: https://aistudio.google.com/apikey
- *(Optional)* a **Google OAuth client** for Google sign-in

## Setup

### 1. Supabase

1. Create a project at https://supabase.com.
2. Under **Storage**, create a **private** bucket named `documents`.
3. Collect from the dashboard:
   - **Connect → ORMs / connection string:** the pooled URL (port `6543`) and the direct URL (port `5432`).
   - **Project Settings → API Keys:** the project URL and the **`service_role`** key. Keep this key on the backend only.

### 2. Google OAuth (optional)

In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials → Create OAuth client ID → Web application**:

- **Authorized JavaScript origins:** `http://localhost:3000`, `http://localhost:5173`
- **Authorized redirect URI:** `http://localhost:3000/auth/google/callback`

Also configure the **OAuth consent screen** with the `email`, `profile` and `openid` scopes. While the app is in testing mode, add yourself as a test user.

If you leave the Google values empty, the Google sign-in button is hidden and email/password login still works.

### 3. Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase **pooled** connection (port 6543, `?pgbouncer=true`), used at runtime |
| `DIRECT_URL` | ✅ | Supabase **direct** connection (port 5432), used by migrations |
| `JWT_SECRET` | ✅ | Long random string |
| `JWT_EXPIRES_IN` | | Token lifetime, default `7d` |
| `GEMINI_API_KEY` | ✅ | Gemini API key |
| `GEMINI_CHAT_MODEL` | | Chat/agent model, e.g. `gemini-2.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | | Default `gemini-embedding-001` |
| `EMBEDDING_DIMENSIONS` | | `768`. Must match `vector(768)` in the migration |
| `SUPABASE_URL` | ✅ | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role / secret key |
| `SUPABASE_STORAGE_BUCKET` | | Default `documents` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | | Enables Google sign-in |
| `GOOGLE_CALLBACK_URL` | | Default `http://localhost:3000/auth/google/callback` |
| `PORT` | | API port, default `3000` |
| `FRONTEND_URL` | | Used for CORS and the OAuth redirect, default `http://localhost:5173` |
| `MAX_FILE_SIZE_MB` | | Upload limit, default `15` |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | | Chunking, default `800` / `120` characters |
| `SEARCH_TOP_K` | | Chunks retrieved per search, default `6` |

The API refuses to start if a ✅ variable is missing.

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL, default `http://localhost:3000` |

### 4. Install and migrate

```bash
cd backend
pnpm install          # also runs `prisma generate`
pnpm prisma:migrate   # creates tables and enables pgvector

cd ../frontend
pnpm install
```

Each package has a `pnpm-workspace.yaml` listing the packages allowed to run install scripts (Prisma on the backend, esbuild on the frontend). If pnpm reports *ignored build scripts*, run `pnpm approve-builds`.

## Running locally

Use two terminals:

```bash
# Terminal 1: API on http://localhost:3000
cd backend
pnpm start:dev

# Terminal 2: app on http://localhost:5173
cd frontend
pnpm dev
```

Open **http://localhost:5173**, create an account, upload a document, wait until its status is **Ready**, and start a chat.

### Scripts

| Backend | |
|---|---|
| `pnpm start:dev` | Run with watch mode |
| `pnpm build` / `pnpm start:prod` | Build to `dist/` and run it |
| `pnpm prisma:migrate` | Apply migrations |
| `pnpm prisma:studio` | Browse the database |

| Frontend | |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm preview` | Production build and local preview |

## API overview

All routes except `auth/register`, `auth/login`, `auth/google*`, `auth/providers` and `health` require `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `GET /auth/providers`, `GET /auth/google`, `GET /auth/google/callback` |
| Users | `PATCH /users/me`, `GET /users/me/stats` |
| Documents | `POST /documents` (multipart), `GET /documents`, `GET/PATCH/DELETE /documents/:id`, `GET /documents/:id/download`, `POST /documents/:id/reprocess` |
| Collections | `POST/GET /collections`, `GET/PATCH/DELETE /collections/:id` |
| Conversations | `POST/GET /conversations`, `GET/PATCH/DELETE /conversations/:id`, `POST /conversations/:id/messages` |
| Search / RAG | `POST /search`, `POST /rag/query` |

## Deployment

- **Frontend → Vercel:** set the root directory to `frontend`. `vercel.json` already rewrites all routes to `index.html`. Set `VITE_API_URL` to your API URL.
- **Backend → Render (or similar):** set the root directory to `backend`.
  - Build: `pnpm install && pnpm build && pnpm prisma:migrate`
  - Start: `pnpm start:prod`
  - Set all backend env vars. Point `FRONTEND_URL` at the Vercel URL and `GOOGLE_CALLBACK_URL` at `https://<api-host>/auth/google/callback`. Add that callback URL to the Google OAuth client.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing required environment variables: …` on startup | Fill in the listed keys in `backend/.env` |
| `503 … model is currently experiencing high demand` | Gemini is overloaded. The client retries automatically; if it keeps failing, set `GEMINI_CHAT_MODEL` to another model (e.g. `gemini-2.5-flash`) and restart the API |
| Google login: `redirect_uri_mismatch` | The redirect URI in Google Cloud must exactly match `GOOGLE_CALLBACK_URL` |
| Upload fails | Check that the `documents` bucket exists and the service role key is correct |
| `@prisma/client did not initialize` | Run `pnpm prisma:generate` (or allow Prisma in `pnpm approve-builds`) |
| Changes to `.env` not picked up | Restart `pnpm start:dev`. Watch mode doesn't reload `.env` |
