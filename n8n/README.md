# n8n Decision Intelligence Workflow — Complete Setup Guide

## What This Workflow Does

```
Express Backend (POST)
        ↓
  Webhook (POST /webhook/decision-analysis)
        ↓
  Validate Input          ← checks title, options, criteria, weights sum=100%
        ↓
  Deterministic Scoring   ← calculates weighted scores (NO AI involvement here)
        ↓
  Prepare Groq Prompt     ← builds system + user prompt with scores as ground truth
        ↓
  Groq AI                 ← calls api.groq.com — explains results, never invents scores
        ↓
  Parse & Validate AI     ← enforces deterministic top option, cleans all fields
        ↓
  Respond to Webhook      ← returns structured JSON to Express backend
        ↓
Express → MongoDB → React Dashboard → Human Decision
```

---

## STEP 1 — Import the Workflow

1. Open your n8n instance at **http://localhost:5678**
2. Click **"Create workflow"** (orange button, top right)
3. In the new empty workflow canvas, click the **three-dot menu (⋮)** in the top-right corner
4. Select **"Import from file..."**
5. Choose the file: `n8n/Decision_Intelligence_Workflow.json`
6. The workflow loads with **7 nodes** on the canvas

---

## STEP 2 — Create the Groq API Credential

This is the most important step. The Groq API key must be stored in n8n — never in the frontend.

1. In n8n, go to the left sidebar → click **"Credentials"**
2. Click **"+ Add credential"**
3. Search for: **"Header Auth"** (it may appear as "HTTP Header Auth")
4. Fill in:
   - **Credential Name:** `Groq API Key`
   - **Name:** `Authorization`
   - **Value:** `Bearer gsk_YOUR_GROQ_API_KEY_HERE`
     - Replace `gsk_YOUR_GROQ_API_KEY_HERE` with your actual key from https://console.groq.com
5. Click **"Save"**

---

## STEP 3 — Connect Credential to the Groq Node

1. Back in the workflow canvas, double-click the **"Groq AI"** node
2. Under the **"Authentication"** section, select **"Generic Credential Type"**
3. Set **"Generic Auth Type"** to **"Header Auth"**
4. Under **"Credential for Header Auth"**, select **"Groq API Key"** (the one you just created)
5. Click **"Save"** in the node panel

---

## STEP 4 — Set the Groq Model (Optional)

By default the workflow uses `llama-3.3-70b-versatile` via `$env.GROQ_MODEL`.

To change it, either:

**Option A — n8n Environment Variable:**
Start n8n with:
```bash
GROQ_MODEL=llama-3.3-70b-versatile npx n8n start
```

**Option B — Hardcode in the node:**
1. Open the **"Groq AI"** node
2. Find the `model` field
3. Replace `={{ $env.GROQ_MODEL || 'llama-3.3-70b-versatile' }}` with your preferred model

**Supported Groq models (as of 2026):**
- `llama-3.3-70b-versatile` ← recommended
- `llama-3.1-70b-versatile`
- `llama-3.1-8b-instant` ← faster, less detailed
- `mixtral-8x7b-32768`

---

## STEP 5 — Activate the Workflow

1. In the workflow canvas, click the **"Inactive"** toggle in the top-right corner
2. It turns green and shows **"Active"**
3. The webhook is now listening at:
   ```
   http://localhost:5678/webhook/decision-analysis
   ```

---

## STEP 6 — Configure the Backend

Open `backend/.env` and ensure:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/decision-analysis
```

If n8n is on a different host/port, update accordingly.

---

## STEP 7 — Test the Webhook Directly

Open a terminal and run this `curl` command to test the workflow independently:

```bash
curl -X POST http://localhost:5678/webhook/decision-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "test-001",
    "title": "Choose the Best Laptop",
    "description": "Evaluate laptops based on price, performance and battery.",
    "category": "Product Selection",
    "options": [
      {
        "id": "opt-1",
        "name": "Laptop A",
        "criteria": { "price": 80, "performance": 95, "battery": 90 }
      },
      {
        "id": "opt-2",
        "name": "Laptop B",
        "criteria": { "price": 90, "performance": 85, "battery": 85 }
      },
      {
        "id": "opt-3",
        "name": "Laptop C",
        "criteria": { "price": 75, "performance": 80, "battery": 80 }
      }
    ],
    "criteria": [
      { "key": "price",       "name": "Price",       "weight": 30 },
      { "key": "performance", "name": "Performance", "weight": 40 },
      { "key": "battery",     "name": "Battery",     "weight": 30 }
    ],
    "weights": {
      "price": 30,
      "performance": 40,
      "battery": 30
    }
  }'
```

**Expected response format:**
```json
{
  "success": true,
  "decisionId": "test-001",
  "recommendation": {
    "option": "Laptop A",
    "score": 88.5
  },
  "confidence": {
    "score": 82,
    "level": "High",
    "category": "High Confidence"
  },
  "calculatedScores": [
    { "option": "Laptop A", "score": 88.5, "rank": 1 },
    { "option": "Laptop B", "score": 86.5, "rank": 2 },
    { "option": "Laptop C", "score": 78.5, "rank": 3 }
  ],
  "aiAnalysis": {
    "recommendation": { "option": "Laptop A", "score": 88.5 },
    "confidence": 82,
    "summary": "...",
    "reasons": ["..."],
    "evidence": [...],
    "risks": [...],
    "alternatives": [...],
    "tradeoffs": [...]
  },
  "humanDecisionRequired": true
}
```

---

## STEP 8 — Verify in n8n Executions

1. After running the curl command (or creating a decision in the frontend):
2. Go to n8n left sidebar → **"Executions"**
3. You should see a new execution entry with status **"Success"**
4. Click on it to inspect each node's input/output

---

## Workflow Node Reference

| Node | Type | Purpose |
|------|------|---------|
| **Webhook** | Webhook Trigger | Receives POST from Express backend |
| **Validate Input** | Code | Checks all required fields, weights sum to 100% |
| **Deterministic Scoring** | Code | Calculates weighted scores mathematically — no AI |
| **Prepare Groq Prompt** | Code | Builds system prompt + grounded user prompt |
| **Groq AI** | HTTP Request | Calls Groq API with JSON response format enforced |
| **Parse & Validate AI Response** | Code | Cleans, validates, grounds AI output against deterministic scores |
| **Respond to Webhook** | Respond to Webhook | Returns structured JSON to Express |

---

## Troubleshooting

### "Execution failed" on Groq AI node
- Check the credential: ensure `Authorization` header value starts with `Bearer `
- Verify your Groq API key is active at https://console.groq.com
- Check n8n execution log for the actual error message from Groq

### Webhook returns 404
- Confirm the workflow is **Active** (green toggle)
- Confirm the webhook path is exactly `decision-analysis` (no leading slash)
- Confirm `N8N_WEBHOOK_URL` in `backend/.env` matches exactly

### "Validation failed: weights must sum to 100%"
- The frontend form requires weights to total exactly 100%
- Check the `CreateDecision` form — the weight indicator must show `100% / 100%`

### n8n shows "Could not find node"
- The workflow requires n8n version 1.0+ for `typeVersion: 2` Code nodes
- Update n8n: `npm update -g n8n`

### Backend falls back to deterministic engine (no Groq)
- This means n8n is offline or returned an error
- Check that the workflow is Active in n8n
- Check `N8N_WEBHOOK_URL` in `backend/.env`
- Run the curl test above to verify the webhook is responding

---

## Security Rules

| Rule | Status |
|------|--------|
| Groq API key stored in n8n credentials | ✅ |
| Groq API key NOT in frontend code | ✅ |
| Groq API key NOT in `backend/.env` (n8n is the only caller) | ✅ |
| React never calls Groq directly | ✅ |
| Webhook URL in backend `.env` only | ✅ |

---

## Architecture Summary

```
React (port 5173)
    │
    │  POST /api/decisions
    ▼
Express (port 5000)
    │
    │  POST http://localhost:5678/webhook/decision-analysis
    ▼
n8n Workflow
    │
    ├─ Validate → Score → Prompt → Groq → Parse
    │
    │  JSON response
    ▼
Express → save to MongoDB
    │
    │  JSON to frontend
    ▼
React Decision Analysis Page
    │
    ▼
Human reviews AI output
    │
    ├─ Accept AI Recommendation
    ├─ Choose Alternative
    └─ Override AI (requires reason)
    │
    ▼
POST /api/decisions/:id/finalize
    │
    ▼
MongoDB Audit Trail
```
