# Obliqo n8n Automation Engine & Source Adapters

This directory contains the n8n automation workflows for Obliqo. It includes the core shared orchestration workflow (`obliqo-message-to-obligation.json`) as well as real platform Source Adapter workflows for **Gmail**, **Telegram**, and **Google Calendar**.

---

## Directory Structure

```
n8n/
├── workflows/
│   ├── obliqo-message-to-obligation.json  # Shared core orchestration workflow
│   ├── obliqo-gmail-source.json           # Gmail trigger & content normalizer workflow
│   ├── obliqo-telegram-source.json        # Telegram bot trigger & message filter workflow
│   └── obliqo-calendar-source.json        # Google Calendar trigger & event normalizer workflow
├── test-data/
│   ├── 01-gmail-insurance.json             # Test payload: Gmail auto insurance renewal
│   ├── 02-gmail-bill.json                  # Test payload: Gmail electricity bill
│   ├── 03-telegram-service.json            # Test payload: Telegram vehicle service
│   ├── 04-calendar-document.json           # Test payload: Calendar driving license renewal
│   ├── 05-non-obligation.json              # Test payload: Casual chat (ignored)
│   ├── 06-duplicate.json                   # Test payload: Duplicate insurance notice
│   ├── 07-gmail-normal.json                # Test payload: Non-obligation email (lunch)
│   ├── 08-gmail-html.json                  # Test payload: HTML email body markup
│   ├── 09-telegram-duplicate.json          # Test payload: Telegram duplicate message
│   ├── 10-telegram-unsupported.json        # Test payload: Telegram sticker/non-text payload
│   ├── 11-calendar-meeting.json            # Test payload: Non-obligation calendar meeting
│   └── 12-calendar-duplicate.json          # Test payload: Duplicate calendar event
├── scripts/
│   └── test-webhook.ts                     # Automated Phase 5 integration test runner
├── docker-compose.yml                      # Containerized local n8n service configuration
└── README.md
```

---

## Architecture Overview

```
 ┌───────────────────────┐  ┌────────────────────────┐  ┌───────────────────────────────┐
 │ Gmail Source Adapter  │  │ Telegram Source Adapter│  │ Google Calendar Source Adapter│
 └───────────┬───────────┘  └───────────┬────────────┘  └───────────────┬───────────────┘
             │                          │                               │
             └──────────────────────────┼───────────────────────────────┘
                                        │
                                        ▼
                  Shared Webhook (POST /webhook/obliqo/message)
                                        │
                                        ▼
                   Message Normalizer & Input Validator (Node)
                                        │
                                        ▼
                   HTTP Request: POST /api/ai/extract-obligation
                                        │
                                        ▼
                         IF: data.isObligation === true?
                           ├── FALSE → Return { "success": true, "processed": false, "created": false, "reason": "No actionable obligation detected" }
                           └── TRUE
                                  │
                                  ▼
                          HTTP Request: POST /api/ai/create-obligation
                                  │
                                  ▼
                          Return Result (Created: true / Duplicate: true / Error: false)
```

---

## Source Adapter Workflows

### 1. Gmail Source Adapter (`obliqo-gmail-source.json`)
- **Trigger:** Polls unread inbox messages matching obligation signals (`Invoice`, `Bill`, `Renewal`, `Due`, `Payment`, `Expiry`, `Appointment`, `Service`, `Subscription`, `Deadline`, `License`).
- **Normalizer Node:** Converts HTML bodies to clean text, strips tracking scripts and signatures, formats subject/content, and maps fields to `source: "GMAIL"`.
- **Credentials:** Uses n8n Gmail OAuth2 account (`gmailOAuth2`).

### 2. Telegram Source Adapter (`obliqo-telegram-source.json`)
- **Trigger:** Listens to incoming bot messages via Telegram webhook (`telegramTrigger`).
- **Normalizer Node:** Filters out stickers, photo attachments, voice clips, and non-text messages safely without workflow failures. Formats text messages to `source: "TELEGRAM"`.
- **Credentials:** Uses n8n Telegram Bot Token (`telegramApi`).

### 3. Google Calendar Source Adapter (`obliqo-calendar-source.json`)
- **Trigger:** Listens for new or updated primary calendar events (`googleCalendarTrigger`).
- **Normalizer Node:** Extracts event summary, description, start time, and organizer email. Formats into `source: "CALENDAR"`.
- **Credentials:** Uses n8n Google Calendar OAuth2 account (`googleCalendarOAuth2Api`).

---

## Webhook Endpoint & Shared Message Schema

### Webhook URL
`POST http://localhost:5678/webhook/obliqo/message`

### Shared Payload Schema
```json
{
  "source": "GMAIL | TELEGRAM | CALENDAR | DOCUMENT | MANUAL",
  "externalId": "string (platform message or event ID)",
  "sender": "string (sender email, username, or handle)",
  "subject": "string (subject line or event title)",
  "content": "string (required raw message content)",
  "timestamp": "ISO 8601 string",
  "metadata": {}
}
```

---

## Credentials Setup in n8n UI

1. **Gmail Setup:**
   - Open `http://localhost:5678` → **Credentials** → **New Credential** → **Gmail OAuth2 API**.
   - Enter Google OAuth Client ID & Client Secret.
   - Authorize email account.

2. **Telegram Setup:**
   - Open Telegram and message [@BotFather](https://t.me/BotFather) to create a bot (`/newbot`).
   - Copy HTTP API Bot Token.
   - Open n8n → **Credentials** → **New Credential** → **Telegram API** → Paste Bot Token.

3. **Google Calendar Setup:**
   - Open n8n → **Credentials** → **New Credential** → **Google Calendar OAuth2 API**.
   - Authorize Google Calendar API scope.

---

## Local n8n Execution & Importing Workflows

1. **Start Local n8n Container:**
   ```bash
   cd n8n
   docker-compose up -d
   ```
2. **Import Workflows into n8n:**
   - Open `http://localhost:5678` in your browser.
   - Click **Workflows** → **Import from File**.
   - Import `obliqo-message-to-obligation.json` (Shared Core Workflow).
   - Import `obliqo-gmail-source.json`, `obliqo-telegram-source.json`, and `obliqo-calendar-source.json`.
   - Toggle **Active** switch on each workflow.

---

## Running Test Suite

Run the full Phase 5 source integration test matrix:
```bash
cd backend
npx tsx ../n8n/scripts/test-webhook.ts
```

### Expected Output:
```
==================================================
Running Obliqo Phase 5 Source Integration Tests
==================================================

--- GMAIL SOURCE ADAPTER TESTS ---
[PASS] TEST 1 [GMAIL]: Insurance Renewal Notice
[PASS] TEST 2 [GMAIL]: Electricity Bill Statement
[PASS] TEST 3 [GMAIL]: Casual Lunch Email (Non-Obligation)
[PASS] TEST 4 [GMAIL]: Duplicate Insurance Email
[PASS] TEST 5 [GMAIL]: HTML Email Body Normalization & Extraction

--- TELEGRAM SOURCE ADAPTER TESTS ---
[PASS] TEST 6 [TELEGRAM]: Vehicle Service Due Notice
[PASS] TEST 7 [TELEGRAM]: Casual Chat Message (Non-Obligation)
[PASS] TEST 8 [TELEGRAM]: Duplicate Vehicle Service Message
[PASS] TEST 9 [TELEGRAM]: Unsupported Sticker/Non-Text Message

--- GOOGLE CALENDAR SOURCE ADAPTER TESTS ---
[PASS] TEST 10 [CALENDAR]: Driving License Renewal Deadline Event
[PASS] TEST 11 [CALENDAR]: Weekly Team Sync Event (Non-Obligation)
[PASS] TEST 12 [CALENDAR]: Duplicate Calendar Event

--- SYSTEM & ERROR HANDLING TESTS ---
[PASS] TEST 13 [SYSTEM]: Invalid Source Enum Rejection
[PASS] TEST 14 [SYSTEM]: Missing Content Rejection

==================================================
Phase 5 Integration Test Matrix Complete. Passed: 14, Failed: 0
==================================================
```
