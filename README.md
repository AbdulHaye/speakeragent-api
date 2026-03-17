# SpeakerAgent.AI

AI-powered scout that finds speaking opportunities (conferences, podcasts, corporate events) matched to a speaker's expertise, then generates personalized pitches.

**What it does:** Speaker signs up → AI scans the web for relevant events → scores and ranks matches → generates outreach hooks → delivers leads to a dashboard.

## Tech Stack

- **Backend:** Python / FastAPI, Claude AI (Anthropic), APScheduler
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Database:** Airtable (REST API)
- **Email:** SendGrid (optional)

## Airtable Setup

Create a base with these 5 tables. The backend reads/writes them automatically — no manual data entry needed.

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **Speakers** | User accounts & billing | speaker_id, full_name, email, password_hash, Plan, scouts_used |
| **Speaker_Persona** | Profile details per persona | speaker_id, persona_name, bio, topics (JSON), credentials, tagline, location |
| **Conferences** | AI-scouted leads (conferences + podcasts) | speaker_id, Conference Name, Match Score, Lead Triage (RED/YELLOW/GREEN), Lead Status, Hook, Best Topic |
| **Contacts** | Manual CRM contacts | speaker_id, full_name, email, organization, contact_type, status |
| **Onboarding_Checklist** | 4-step setup guide | speaker_id, Task, Status (Incomplete/Completed), Order |

Tables are auto-created if you run the Airtable Metadata API setup. Or create them manually — field names must match exactly.

## Environment Variables

**Backend (`.env`)**

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_API_KEY` | Yes | Anthropic API key |
| `AIRTABLE_API_KEY` | Yes | Airtable Personal Access Token |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID (starts with `app`) |
| `API_KEY` | Yes | Shared key for frontend ↔ backend auth |
| `CORS_ORIGINS` | No | Default: `http://localhost:3000` |
| `FRONTEND_URL` | No | For welcome emails |
| `SENDGRID_API_KEY` | No | Email delivery |
| `SERP_API_KEY` | No | Trending topic searches |

**Frontend (`frontend/.env.local`)**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (`http://localhost:8000`) |
| `NEXT_PUBLIC_API_KEY` | Same as `API_KEY` in backend |

## Run Locally

### 1. Backend

```bash
cd speakeragent-api
pip install -r requirements.txt
cp .env.example .env    # fill in your keys
uvicorn src.api.dashboard_api:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local    # fill in your keys
npm run dev
```

### 3. Run Tests

```bash
cd speakeragent-api
pip install pytest
pytest tests/ -v
```

| Test File | What It Covers |
|-----------|---------------|
| `test_airtable.py` | Airtable connection and CRUD operations |
| `test_scoring.py` | Claude AI lead scoring logic |
| `test_scout_integration.py` | Full scout pipeline (search → score → push) |

Tests hit real APIs — your `.env` keys must be set.

### 4. Verify

1. `http://localhost:3000/register` — create an account (4-step form)
2. `http://localhost:3000` — login with email + password
3. `http://localhost:3000/dashboard` — leads processing page + dashboard
4. `http://localhost:3000/admin` — all users, lead stats, system health
