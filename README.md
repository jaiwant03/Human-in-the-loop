# Human-in-the-Loop Decision Intelligence Platform

> **AI recommends. Humans decide.**

A production-style hackathon project demonstrating a decision-support system where AI provides recommendations, evidence, confidence, risks, and alternatives — while **explicitly preserving the final decision for the human user**.

---

## Problem Statement

Enterprise decision-making is complex. AI can crunch numbers and surface patterns, but blindly trusting AI outputs introduces opacity, bias, and accountability gaps. This platform demonstrates a responsible AI paradigm:

```
AI Recommends → AI Explains → Human Evaluates → Human Decides → System Records
```

The system **never** automatically finalises a decision. Every AI recommendation is advisory. Every human choice is logged with its justification.

---

## Key Features

| Feature | Description |
|---|---|
| **Deterministic Scoring Engine** | Weighted multi-criteria algorithm — no LLM-invented scores |
| **Groq AI Reasoning** | Groq LPU inference via n8n for natural-language trade-off analysis |
| **Explainable Evidence** | Positive drivers and negative trade-offs grounded in supplied data |
| **Analytical Confidence** | Formula-based confidence (completeness, separation, coverage) |
| **Risk Assessment** | Severity-classified risks derived from score gaps |
| **Alternative Options** | Runner-up candidates with reasoning |
| **Human Decision Panel** | Accept AI / Choose Alternative / Override AI (with required justification) |
| **What-If Simulator** | Adjust criteria weights and see rank changes in real-time without altering the original decision |
| **Decision Audit Trail** | MongoDB stores both AI recommendation and human final choice |
| **Chart.js Visualizations** | Bar charts, radar charts, doughnut charts for score comparison and analytics |

---

## Architecture

```
React Frontend (Vite)
        │  REST API (Axios)
        ▼
Node.js + Express Backend
        │  HTTP POST
        ▼
n8n Webhook Workflow
        │
        ├── Input Validation
        ├── Deterministic Score Calculation
        ├── Groq AI (LLM Reasoning)
        ├── Confidence Validation
        ├── Structured JSON Output
        ▼
Node.js Backend → MongoDB
        ▼
React Dashboard
        ▼
Human Review
        ├── Accept Recommendation
        ├── Choose Alternative
        └── Override AI (reason required)
        ▼
MongoDB Decision Audit Log
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), JavaScript, CSS, Axios, React Router, Chart.js |
| Backend | Node.js, Express.js, Mongoose, Axios, dotenv, CORS |
| Database | MongoDB |
| AI Orchestration | n8n (Webhook Workflow) |
| LLM | Groq API (configurable model, default: `llama-3.3-70b-versatile`) |

---

## n8n Workflow

Import `n8n/Decision_Intelligence_Workflow.json` into your n8n instance:

1. **Webhook Entry Point** — Receives decision payload from backend
2. **Input Validation** — Validates options and criteria
3. **Deterministic Scoring** — Calculates weighted scores (Code node)
4. **Groq Prompt Construction** — Builds grounded system + user prompt
5. **Groq AI HTTP Request** — Calls `api.groq.com` with structured JSON response format
6. **Parse & Confidence Validation** — Enforces deterministic top pick, calculates analytical confidence
7. **Respond to Webhook** — Returns structured analysis to backend

---

## Database Schema

### Decision Document

```json
{
  "_id": "ObjectId",
  "userId": "analyst-1",
  "title": "Select Best Supplier for Raw Materials",
  "description": "Strategic supplier selection...",
  "category": "Supplier Selection",
  "options": [{ "name": "Supplier A", "criteria": { "cost": 78, "quality": 92 } }],
  "criteria": [{ "key": "cost", "name": "Cost Efficiency", "weight": 20 }],
  "weights": { "cost": 20, "quality": 30 },
  "calculatedScores": [{ "name": "Supplier A", "score": 87.5, "rank": 1 }],
  "aiAnalysis": {
    "recommendation": { "option": "Supplier A", "score": 87.5 },
    "confidence": 87,
    "summary": "...",
    "evidence": [],
    "risks": [],
    "alternatives": [],
    "tradeoffs": []
  },
  "humanDecision": {
    "option": "Supplier B",
    "type": "OVERRIDE_AI",
    "reason": "Budget is the priority for Q3.",
    "decidedAt": "2026-09-29T..."
  },
  "status": "FINALIZED",
  "auditLogs": [...]
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/decisions` | Create a new decision (with automatic AI analysis) |
| `POST` | `/api/decisions/:id/analyze` | Re-run AI analysis on existing decision |
| `GET` | `/api/decisions` | List all decisions (with optional filters) |
| `GET` | `/api/decisions/:id` | Get decision details + simulations |
| `POST` | `/api/decisions/:id/finalize` | Record human final decision |
| `POST` | `/api/decisions/:id/simulate` | Run what-if simulation |
| `POST` | `/api/decisions/seed-demo` | Seed canonical supplier demo |
| `GET` | `/api/dashboard/stats` | Aggregated analytics |
| `GET` | `/api/health` | Health check |

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB (running locally or Atlas URI)
- n8n (optional — system falls back gracefully)

### 1. Clone & Install

```bash
git clone <repository-url>
cd Human-in-the-loop

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hitl_decision_intelligence
N8N_WEBHOOK_URL=http://localhost:5678/webhook/decision-analysis
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Configure n8n (Optional)

```bash
# Install & start n8n
npx n8n start
```

1. Open n8n at `http://localhost:5678`
2. Import `n8n/Decision_Intelligence_Workflow.json`
3. Add Groq API key in n8n credentials or environment
4. Activate the workflow

### 4. Run the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## Demo Walkthrough

1. Open the landing page → Click **"Supplier Demo"** or **"Create New Decision"**
2. The seeded scenario evaluates **Supplier A**, **Supplier B**, and **Supplier C** across Cost, Quality, Delivery, Reliability, Risk
3. View the **AI Recommendation** (Supplier A, score 87.5), **Evidence**, **Risks**, **Alternatives**
4. Open the **What-If Simulator** → Increase Cost weight to 45% → Supplier B overtakes
5. Return to the decision → Choose **"Override AI"** → Select Supplier B → Enter reason: *"Budget priority for Q3"*
6. Visit **Audit Trail** — see both AI recommendation and human override recorded

---

## Human-in-the-Loop Rules

| # | Rule |
|---|---|
| 1 | AI recommendation is NOT the final decision |
| 2 | Human must explicitly select the final option |
| 3 | Human can accept the AI recommendation |
| 4 | Human can choose an alternative |
| 5 | Human can override the AI completely |
| 6 | Override reason is stored and auditable |
| 7 | System preserves both AI and Human decisions |
| 8 | System never modifies the original AI recommendation |

---

## AI Design Principle

| Deterministic (Code Calculates) | AI Reasoning (Groq Explains) |
|---|---|
| Weighted scores | Natural-language rationale |
| Rankings | Trade-off summaries |
| Score differences | Risk identification |
| Confidence formula | Evidence interpretation |
| Data completeness | "Insufficient data" disclaimer |

The AI **never invents** numerical scores. If information is missing, it states: *"Insufficient data"*.

---

## Security

- ✅ Groq API key **never** in frontend code
- ✅ Groq API key configured inside n8n credentials or backend `.env`
- ✅ `.env` files in `.gitignore`
- ✅ Input validation on frontend and backend
- ✅ Centralized error handler hides stack traces
- ✅ CORS configured
- ✅ MongoDB injection prevention via Mongoose schemas

---

## Future Enhancements

- [ ] User authentication (JWT)
- [ ] Role-based access control
- [ ] Multi-domain templates (Career, Investment, Event)
- [ ] PDF export of decision audit reports
- [ ] Collaborative multi-stakeholder decision voting
- [ ] Real-time WebSocket notifications
- [ ] Advanced sensitivity Monte Carlo analysis
- [ ] Integration with Slack/Teams for decision notifications

---

## Project Structure

```
Human-in-the-loop/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DecisionCard.jsx
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── EvidenceCard.jsx
│   │   │   ├── RiskCard.jsx
│   │   │   ├── AlternativeCard.jsx
│   │   │   ├── HumanDecisionPanel.jsx
│   │   │   ├── ScoreChart.jsx
│   │   │   └── ConfidenceIndicator.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateDecision.jsx
│   │   │   ├── DecisionAnalysis.jsx
│   │   │   ├── DecisionHistory.jsx
│   │   │   ├── DecisionDetails.jsx
│   │   │   └── WhatIfSimulator.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── dashboard.css
│   │   │   └── decision.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── decisionController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/
│   │   ├── Decision.js
│   │   ├── Simulation.js
│   │   └── User.js
│   ├── routes/
│   │   ├── decisionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/
│   │   ├── n8nService.js
│   │   └── scoringService.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── n8n/
│   ├── Decision_Intelligence_Workflow.json
│   └── README.md
├── .env.example
├── .gitignore
└── README.md
```

---

## Final Philosophy

> *"AI does not replace the decision-maker. It augments the decision-maker."*

This platform provides **Explainability**, **Transparency**, **Uncertainty Awareness**, **Alternatives**, **Human Control**, and **Accountability** — all in a single cohesive system.

**AI recommends. Humans decide.**
