# StudyingMadeEasy

Turn course PDFs into a searchable study library and a source-grounded AI tutor.

**[Open the live website](https://studying-made-easy-sepia.vercel.app)**

StudyingMadeEasy lets each user create private courses, upload PDF notes or readings, search those materials by meaning, and ask an AI tutor questions. Tutor responses are grounded in retrieved passages and include the source document and page number used to answer.

## What it can do

- Register and log in with JWT-based authentication
- Create and browse private courses
- Upload PDF notes, readings, and slides
- Extract text page by page with `pypdf`
- Split documents into searchable chunks
- Generate normalized, 384-dimensional embeddings with `all-MiniLM-L6-v2`
- Store and search embeddings with PostgreSQL and `pgvector`
- Rank course material using cosine distance
- Ask a RAG-powered AI tutor questions about uploaded material
- See the PDF filename and page behind each tutor response
- Continue a tutor conversation with frontend-managed chat history

## How it works

```mermaid
flowchart LR
    A[Next.js web app] -->|JWT API requests| B[FastAPI backend]
    B --> C[(PostgreSQL + pgvector)]
    B --> D[OpenAI API]
    E[Course PDF] --> F[pypdf extraction]
    F --> G[Text chunking]
    G --> H[all-MiniLM-L6-v2 embeddings]
    H --> C
    C -->|Cosine similarity results| B
    B -->|Answer + PDF/page sources| A
```

When a PDF is uploaded, the backend extracts each page, chunks its text, and creates a normalized embedding for every chunk. A search or tutor question is embedded with the same model, then compared with stored course chunks using pgvector cosine distance. The most relevant passages become the context supplied to the OpenAI API.

## Technology

### Frontend

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/)
- TypeScript
- Tailwind CSS 4
- Responsive custom interface

### Backend

- [FastAPI](https://fastapi.tiangolo.com/)
- Python 3.12
- SQLAlchemy 2
- Alembic migrations
- Pydantic validation
- JWT authentication with PyJWT
- Argon2 password hashing
- `pypdf` for page-aware PDF extraction
- OpenAI API for tutor responses

### Search and data

- PostgreSQL
- [pgvector](https://github.com/pgvector/pgvector)
- `sentence-transformers/all-MiniLM-L6-v2`
- 384-dimensional normalized vectors
- Cosine-distance semantic search
- Sentence Transformers on macOS/Windows
- FastEmbed/ONNX on Linux for lower memory usage with the same embedding model

### Hosting

- Frontend: Vercel
- Backend: Render
- Hosted database: Neon PostgreSQL
- Local database: Docker with the `pgvector/pgvector:pg16` image

## Repository layout

```text
StudyingMadeEasy/
├── backend/             FastAPI application, models, services, and migrations
│   ├── alembic/         Database migrations
│   ├── api/             Authentication, courses, documents, search, and tutor routes
│   ├── models/          SQLAlchemy models
│   ├── schemas/         Request and response models
│   └── services/        PDF, embedding, and OpenAI integrations
├── frontend/            Next.js application
│   └── app/             Pages, components, styles, and API client
├── docker-compose.yml   Local PostgreSQL + pgvector service
└── render.yaml          Render backend configuration
```

## Run it locally

### Prerequisites

- Git
- Python 3.12
- Node.js and npm
- Docker Desktop
- An OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/masonwooldridge/StudyingMadeEasy.git
cd StudyingMadeEasy
```

### 2. Start PostgreSQL and pgvector

```bash
docker compose up -d
```

The included development database is available at `localhost:5432` with database name `studyai`, username `studyai`, and password `studyai_password`.

### 3. Configure and start the backend

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql+psycopg://studyai:studyai_password@localhost:5432/studyai
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=replace-with-your-openai-api-key
FRONTEND_URL=http://localhost:3000
```

Then install the dependencies, run the migrations, and start FastAPI:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

The API will run at `http://localhost:8000`. Check it at `http://localhost:8000/health/database`.

On Windows PowerShell, activate the environment with:

```powershell
.venv\Scripts\Activate.ps1
```

### 4. Configure and start the frontend

In another terminal, create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then start Next.js:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Backend | Secret used to sign authentication tokens |
| `JWT_ALGORITHM` | Backend | JWT signing algorithm; defaults to `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Authentication token lifetime |
| `OPENAI_API_KEY` | Backend | OpenAI API access for tutor responses |
| `FRONTEND_URL` | Backend | Additional allowed frontend origin for CORS |
| `NEXT_PUBLIC_API_URL` | Frontend | Public URL of the FastAPI backend |

Never commit real secrets or local `.env` files.

## Deployment notes

The hosted version uses free service tiers. Render may put the backend to sleep after inactivity, so the first request can take longer while it wakes up.

Uploaded PDFs are currently saved to the backend's local `uploads/` directory. That is convenient for local development, but a free Render instance does not provide durable local storage across every restart or deployment. The extracted text and embeddings remain in PostgreSQL; durable original-file storage should use an object-storage service such as Cloudflare R2, Amazon S3, or Neon Object Storage.

## Live services

- Website: [studying-made-easy-sepia.vercel.app](https://studying-made-easy-sepia.vercel.app)
- API health: [studying-made-easy-api.onrender.com/health/database](https://studying-made-easy-api.onrender.com/health/database)

