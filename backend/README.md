# Obliqo Backend API

Obliqo is an AI Personal Obligation Intelligence platform. This repository contains the backend service built with Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, and local AI LLM extraction powered by Ollama.

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Framework:** Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **AI Engine:** Ollama Local LLM (llama3.2 / llama3)
- **Validation:** Zod
- **Logging:** Custom clean logger

---

## Directory Structure

```
backend/
├── src/
│   ├── app.ts                  # Express application setup & middleware
│   ├── server.ts               # HTTP server listener & graceful shutdown
│   │
│   ├── config/
│   │   └── env.ts              # Environment configuration loader
│   │
│   ├── routes/
│   │   ├── health.routes.ts    # /api/health and /api/health/database routes
│   │   ├── obligations.routes.ts # /api/obligations REST routes
│   │   └── ai.routes.ts        # /api/ai/extract-obligation & /api/ai/create-obligation routes
│   │
│   ├── controllers/
│   │   ├── health.controller.ts    # Health check handlers
│   │   ├── obligations.controller.ts # Obligation CRUD controller handlers
│   │   └── ai.controller.ts        # AI obligation extraction handlers
│   │
│   ├── services/
│   │   ├── obligations.service.ts  # Database service & query pipeline
│   │   └── ai/
│   │       ├── ai-prompts.ts               # Centralized extraction system prompt
│   │       ├── ai-provider.interface.ts    # Provider abstraction interface
│   │       ├── ollama.service.ts           # Ollama client provider
│   │       ├── mock-ai.service.ts          # Deterministic test provider
│   │       └── obligation-extractor.service.ts # Extraction & normalization pipeline
│   │
│   ├── middleware/
│   │   ├── validation.middleware.ts# Zod validation middleware
│   │   ├── error.middleware.ts     # Central error handler
│   │   └── notFound.middleware.ts  # 404 handler
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript interface definitions
│   │
│   └── utils/
│       └── logger.ts               # Console logger
│
├── tests/
│   ├── obligations.test.ts     # Phase 2 Obligation CRUD test suite
│   └── ai-extraction.test.ts   # Phase 3 AI extraction test suite
│
├── prisma/
│   ├── schema.prisma           # Prisma database schema definition
│   └── seed.ts                 # Database seed script for development
│
├── docker-compose.yml          # Containerized PostgreSQL service
├── .env.example                # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Ollama Local AI Setup

Obliqo uses Ollama for local LLM obligation extraction without sending data to third-party cloud APIs.

### 1. Install Ollama
Download and install Ollama from [ollama.com](https://ollama.com).

### 2. Pull Model
Run the following command to download the default model:
```bash
ollama pull llama3.2
```

### 3. Start Ollama Daemon
Ensure the Ollama service is running locally on port `11434`:
```bash
ollama serve
```

---

## Getting Started

### 1. Requirements

- Node.js (v18+)
- PostgreSQL (Local or via Docker)
- Ollama (Local LLM)

### 2. Environment Setup

Copy `.env.example` to `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/obliqo_db?schema=public"
FRONTEND_URL="http://localhost:8080"
NODE_ENV="development"

# Ollama AI Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
OLLAMA_TIMEOUT_MS=30000
```

---

### 3. Database & Migrations

**Start PostgreSQL Container:**
```bash
docker-compose up -d
```

**Run Database Migration & Seeding:**
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

---

### 4. Running Tests & Backend

**Run Test Suite:**
```bash
npm test
```

**Start Development Server:**
```bash
npm run dev
```

---

## API Endpoints

### AI Obligation Extraction Endpoints

#### 1. Extract Obligation from Raw Text (No Database Save)
- **Endpoint:** `POST /api/ai/extract-obligation`
- **Request Body:**
  ```json
  {
    "text": "Your car insurance policy expires on October 5, 2026. Renewal amount: ₹8,500."
  }
  ```
- **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "data": {
      "isObligation": true,
      "obligation": {
        "title": "Car Insurance Renewal",
        "description": "Car insurance policy expiration and renewal",
        "category": "INSURANCE",
        "amount": 8500,
        "currency": "INR",
        "deadline": "2026-10-05",
        "priority": "HIGH",
        "recurrence": "YEARLY"
      }
    }
  }
  ```

#### 2. Extract & Save Obligation to Database
- **Endpoint:** `POST /api/ai/create-obligation`
- **Request Body:**
  ```json
  {
    "text": "Your car insurance policy expires on October 5, 2026. Renewal amount: ₹8,500.",
    "source": "MANUAL"
  }
  ```
- **Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Obligation created from text successfully",
    "data": {
      "id": "e8d7f3c4-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      "title": "Car Insurance Renewal",
      "category": "INSURANCE",
      "amount": "8500.00",
      "currency": "INR",
      "deadline": "2026-10-05T00:00:00.000Z",
      "priority": "HIGH",
      "recurrence": "YEARLY",
      "source": "MANUAL",
      "status": "PENDING"
    }
  }
  ```

---

### Obligation Management Endpoints

- `GET /api/obligations` — Paginated list with search, filter, and sorting
- `GET /api/obligations/:id` — Obligation detail with relations
- `GET /api/obligations/summary` — Overview dashboard metrics
- `GET /api/obligations/attention` — Obligations requiring immediate user action
- `POST /api/obligations` — Create obligation
- `PATCH /api/obligations/:id` — Update obligation
- `POST /api/obligations/:id/complete` — Mark obligation complete
- `POST /api/obligations/:id/archive` — Soft archive obligation
- `DELETE /api/obligations/:id` — Soft archive fallback
