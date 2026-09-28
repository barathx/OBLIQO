# OBLIQO — AI Personal Obligation Intelligence Platform

Obliqo is an AI-powered personal obligation intelligence platform that automatically ingests messages and notifications from real external sources (Gmail, Telegram, Google Calendar), normalizes them using n8n workflows, extracts structured obligation intelligence using a local Ollama LLM (`llama3.2`), persists obligations and scheduled reminders in PostgreSQL via Prisma, and delivers real-time notifications to a reactive frontend workspace.

---

## 1. Project Architecture & Connection Flow

```text
================================================================================
                    GMAIL / TELEGRAM / GOOGLE CALENDAR
                                     │
                                     ▼
                        n8n AUTOMATION ENGINE (Port 5678)
                        Workflow: Message Ingestion & Normalization
                                     │
                                     ▼
                     OLLAMA LOCAL LLM (Port 11434, llama3.2)
                        Prompt: AI Obligation Extraction
                                     │
                                     ▼
                      EXPRESS BACKEND API (Port 3000)
                        Pipeline: Obligation Creation & Validation
                                     │
                                     ▼
                       POSTGRESQL DATABASE (Port 5432)
                        Prisma Models: Obligation, Reminder, Notification
                                     │
                                     ▼
                REMINDER & NOTIFICATION SCHEDULER (60s Tick)
                        Status Engine: PENDING → SENT / CANCELLED
                                     │
                                     ▼
                 REACT FRONTEND WORKSPACE (Port 8080 / 5173)
                        Reactive Store & Polling (10s Refresh)
================================================================================
```

### Component Communication & URLs:
- **n8n → Backend API:** `POST http://localhost:3000/api/ai/create-obligation`
- **n8n → Ollama AI:** `POST http://localhost:11434/api/generate`
- **Backend → PostgreSQL:** `postgresql://postgres:postgres@localhost:5432/obliqo_db`
- **Frontend → Backend API:** `http://localhost:3000` (`VITE_API_URL`)

---

## 2. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker & Docker Desktop**: For PostgreSQL and n8n containers
- **Ollama**: Local LLM runner ([ollama.com](https://ollama.com))

---

## 3. Required Software

1. Node.js & npm (`node -v`, `npm -v`)
2. Docker Desktop (`docker --version`)
3. Ollama (`ollama --version`)

---

## 4. Folder Structure

```text
personalAssistant/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express application setup
│   │   ├── server.ts               # HTTP listener & scheduler startup
│   │   ├── config/env.ts           # Environment loader
│   │   ├── controllers/            # Route controllers
│   │   ├── services/               # Obligations, AI, Reminder, Scheduler services
│   │   ├── routes/                 # API route declarations
│   │   ├── middleware/             # Validation, error, 404 handlers
│   │   ├── types/                  # TypeScript interfaces
│   │   └── utils/logger.ts         # Console logger
│   ├── tests/                      # Automated test suites (Phases 2, 3, 7, 8, 9)
│   ├── prisma/                     # schema.prisma and seed.ts
│   ├── docker-compose.yml          # PostgreSQL container definition
│   ├── package.json & package-lock.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/             # React UI components & popovers
│   │   ├── pages/                  # Overview, Obligations, ObligationDetail, etc.
│   │   ├── services/apiClient.ts   # Reactive API client & 10s background polling
│   │   ├── hooks/use-obliqo.ts     # External store hook
│   │   └── types/obligation.ts     # Frontend type definitions
│   ├── package.json & package-lock.json
│   ├── vite.config.ts
│   └── .env.example
├── n8n/
│   ├── workflows/                  # Workflow JSON exports
│   │   ├── obliqo-gmail-source.json
│   │   ├── obliqo-telegram-source.json
│   │   ├── obliqo-calendar-source.json
│   │   └── obliqo-message-to-obligation.json
│   ├── test-data/                  # Sample JSON payloads
│   ├── scripts/                    # Webhook trigger scripts
│   ├── docker-compose.yml          # n8n container definition
│   └── .env.example
├── README.md                       # Master project documentation
└── .env.example                    # Master environment variable template
```

---

## 5. Environment Variables Setup

Create `.env` files from `.env.example` in `backend/` and `frontend/`:

### `backend/.env`
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/obliqo_db?schema=public"
FRONTEND_URL="http://localhost:8080"
NODE_ENV="development"

OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
OLLAMA_TIMEOUT_MS=30000
```

### `frontend/.env`
```env
VITE_API_URL="http://localhost:3000"
```

---

## 6. PostgreSQL Setup

1. Start container:
   ```bash
   cd backend
   docker-compose up -d
   ```
2. Verify container is listening on `localhost:5432`.

---

## 7. Prisma Setup

Run database schema push and seed data:
```bash
cd backend
npx prisma db push
npm run db:seed
```

---

## 8. Ollama AI Setup

1. Download Ollama from [ollama.com](https://ollama.com).
2. Pull the default extraction model:
   ```bash
   ollama pull llama3.2
   ```
3. Start the daemon:
   ```bash
   ollama serve
   ```

---

## 9. Backend Setup

Install dependencies and start development server:
```bash
cd backend
npm install
npm run dev
```
The server listens on `http://localhost:3000` and initializes `ReminderScheduler`.

---

## 10. n8n Setup (Optional Automation Engine)

1. Start n8n container:
   ```bash
   cd n8n
   docker-compose up -d
   ```
2. Open `http://localhost:5678`.
3. Import workflow JSON files from `n8n/workflows/`.

---

## 11. Frontend Setup

Install dependencies and start development server:
```bash
cd frontend
npm install
npm run dev
```
The UI loads at `http://localhost:8080` (or `http://localhost:5173`).

---

## 12. Gmail Integration Setup

1. n8n uses Gmail Trigger Node or Webhook listening for new unread emails.
2. Formats email body and posts to `POST http://localhost:3000/api/ai/create-obligation` with `source: "GMAIL"`.

---

## 13. Telegram Integration Setup

1. Telegram Bot registered via `@BotFather`.
2. n8n Telegram Trigger Node listens for incoming bot messages.
3. Posts message text to `POST http://localhost:3000/api/ai/create-obligation` with `source: "TELEGRAM"`.

---

## 14. Google Calendar Integration Setup

1. Google Calendar OAuth2 connected in n8n.
2. n8n checks upcoming event deadlines daily.
3. Posts event summary to `POST http://localhost:3000/api/ai/create-obligation` with `source: "CALENDAR"`.

---

## 15. Service Ports Summary

| Service | Port | Endpoint / URL |
|---|---|---|
| Express Backend API | `3000` | `http://localhost:3000` |
| PostgreSQL Database | `5432` | `localhost:5432/obliqo_db` |
| Ollama AI Engine | `11434` | `http://localhost:11434` |
| n8n Engine | `5678` | `http://localhost:5678` |
| React Frontend | `8080` / `5173` | `http://localhost:8080` |

---

## 16. API Endpoints Reference

### Health
- `GET /api/health` — System status
- `GET /api/health/database` — Database status

### Obligations
- `GET /api/obligations` — Paginated obligations (filters: search, status, priority, category, source)
- `GET /api/obligations/:id` — Obligation detail with relations
- `GET /api/obligations/summary` — Overview counts
- `GET /api/obligations/attention` — Actionable items
- `POST /api/obligations` — Create obligation
- `PATCH /api/obligations/:id` — Partial update
- `POST /api/obligations/:id/complete` — Mark complete
- `POST /api/obligations/:id/archive` — Soft archive
- `POST /api/obligations/:id/reminder` — Schedule reminder

### AI Extraction
- `POST /api/ai/extract-obligation` — Extract JSON without saving
- `POST /api/ai/create-obligation` — Extract JSON & save to DB

### Reminders & Notifications
- `GET /api/reminders` — List reminders
- `POST /api/reminders` — Create reminder
- `DELETE /api/reminders/:id` — Delete reminder
- `GET /api/notifications` — List notifications
- `GET /api/notifications/unread` — List unread notifications
- `PATCH /api/notifications/:id/read` — Mark read
- `PATCH /api/notifications/read-all` — Mark all read

---

## 17. Automated Test Commands

Run all 61 automated tests across Phases 2, 3, 7, 8, and 9:
```bash
cd backend
npm test
```

---

## 18. Complete End-to-End Test Procedure

Execute the following PowerShell command to test the complete pipeline:

```powershell
$body = @{
    text = "Your HDFC Ergo Health Insurance Policy expires on November 15, 2026. Renewal premium is ₹12,500."
    source = "GMAIL"
} | ConvertTo-Json

# 1. Create obligation via AI pipeline
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/ai/create-obligation" -Method POST -ContentType "application/json" -Body $body
Write-Output "Created Obligation ID: $($res.data.id)"

# 2. Check Reminders
$rem = Invoke-RestMethod -Uri "http://localhost:3000/api/reminders?obligationId=$($res.data.id)"
Write-Output "Reminders created: $($rem.data.Count)"

# 3. Check Notifications
$notif = Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/unread"
Write-Output "Unread notifications: $($notif.data.Count)"
```

---

## 19. Troubleshooting

- **PostgreSQL Connection Error**: Ensure Docker container is running (`docker ps`) and credentials in `.env` match `docker-compose.yml`.
- **Ollama Timeout**: Verify `ollama serve` is active on port `11434` and `ollama pull llama3.2` completed.
- **Port Conflict**: If port `3000` or `8080` is in use, modify `PORT` in `backend/.env` or `frontend/vite.config.ts`.

---

## 20. Known Limitations

- None. All features operating deterministically.
