# n8n Setup Guide for Human-in-the-Loop Decision Intelligence Platform

This guide explains how to set up and configure the n8n workflow that powers the AI analysis layer.

---

## Architecture Overview

```
React Frontend
    ↓
Express Backend
    ↓
n8n Webhook (POST /webhook/decision-analysis)
    ↓
    ├── Validate Input
    ├── Calculate Deterministic Scores
    ├── Build Groq Prompt
    ├── Call Groq API
    ├── Parse & Validate Response
    ├── Calculate Confidence
    └── Return Structured JSON
    ↓
Express Backend
    ↓
React Frontend → Human Decision
```

---

## Prerequisites

- n8n installed (local or cloud instance)
- Groq API key
- Node.js environment for testing

---

## Installation Steps

### 1. Install n8n

**Option A: NPX (Quick Start)**
```bash
npx n8n
```

**Option B: npm Global Install**
```bash
npm install -g n8n
n8n start
```

**Option C: Docker**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

n8n will be available at: `http://localhost:5678`

---

### 2. Import the Workflow

1. Open n8n at `http://localhost:5678`
2. Click **Workflows** in the left sidebar
3. Click **+ Add Workflow**
4. Click the three-dot menu (⋮) → **Import from File**
5. Select `n8n/Decision_Intelligence_Workflow.json`
6. The workflow will load with 7 nodes

---

### 3. Configure Groq API Credentials

The workflow calls Groq AI. You must configure your API key.

**Method 1: Environment Variable (Recommended)**

Set the environment variable before starting n8n:

```bash
# Linux/Mac
export GROQ_API_KEY="your_groq_api_key_here"
n8n start

# Windows PowerShell
$env:GROQ_API_KEY="your_groq_api_key_here"
n8n start
```

**Method 2: n8n Credentials Manager**

1. Go to **Settings** → **Credentials**
2. Click **+ Add Credential**
3. Search for **HTTP Header Auth** or **Generic**
4. Create a credential named `Groq API Key`
5. Set:
   - **Name**: `Authorization`
   - **Value**: `Bearer YOUR_GROQ_API_KEY`
6. Save

Then update the **Groq AI HTTP Request** node:
- Click the node
- Under **Authentication**, select **Generic Credential Type**
- Choose your `Groq API Key` credential

---

### 4. Activate the Webhook

1. Click on the **Webhook Entry Point** node
2. Copy the **Production URL**
   - Example: `http://localhost:5678/webhook/decision-analysis`
3. The webhook is now listening for POST requests

---

### 5. Activate the Workflow

1. Click the **Inactive** toggle in the top-right
2. It should change to **Active**
3. The webhook is now live

---

### 6. Configure Backend `.env`

In your **backend/.env** file, set:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/decision-analysis
```

If n8n is running on a different host/port, adjust accordingly.

---

## Workflow Nodes Explained

### Node 1: Webhook Entry Point

- **Type**: Webhook Trigger
- **Method**: POST
- **Path**: `/decision-analysis`
- **Receives**: Decision payload from Express backend

### Node 2: Input Validation

- **Type**: Code (JavaScript)
- **Purpose**: Validates decision structure
- **Checks**:
  - `title` exists
  - At least 2 `options`
  - At least 2 `criteria`
  - Weights are valid

**Error Handling**: Throws error if validation fails

### Node 3: Deterministic Scoring

- **Type**: Code (JavaScript)
- **Purpose**: Calculates weighted scores WITHOUT AI
- **Algorithm**:
  ```javascript
  for each option:
    score = sum(criterionValue × criterionWeight)
  ```
- **Output**:
  - Sorted scores by rank
  - Top option identified
  - Runner-up identified

### Node 4: Prepare Groq Prompt

- **Type**: Code (JavaScript)
- **Purpose**: Constructs system + user prompts for Groq
- **System Prompt**: Defines AI role as "explainable decision-support AI"
- **User Prompt**: Includes decision context + deterministic scores
- **Key Rule**: AI MUST NOT invent scores — only explain them

### Node 5: Groq AI HTTP Request

- **Type**: HTTP Request
- **URL**: `https://api.groq.com/openai/v1/chat/completions`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer $GROQ_API_KEY`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "model": "llama-3.3-70b-versatile",
    "messages": [...],
    "response_format": { "type": "json_object" },
    "temperature": 0.2
  }
  ```
- **Timeout**: 20 seconds

### Node 6: Parse & Confidence Validation

- **Type**: Code (JavaScript)
- **Purpose**:
  - Parses Groq JSON response
  - Enforces deterministic top recommendation
  - Calculates analytical confidence score
- **Confidence Formula**:
  ```
  completeness × 30% +
  separation × 30% +
  strength × 20% +
  coverage × 20%
  ```
- **Validates**:
  - Evidence exists
  - Risks are structured
  - Alternatives reference real options

### Node 7: Respond to Webhook

- **Type**: Respond to Webhook
- **Response**: JSON with:
  - `success: true`
  - `data`: AI analysis
  - `calculatedScores`: Deterministic scores

---

## Testing the Workflow

### Test Directly in n8n

1. Click the **Webhook Entry Point** node
2. Click **Listen for Test Event**
3. Use this `curl` command:

```bash
curl -X POST http://localhost:5678/webhook/decision-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "test-123",
    "title": "Select Best Supplier",
    "description": "Choose the best supplier",
    "category": "Supplier Selection",
    "options": [
      {
        "id": "opt-a",
        "name": "Supplier A",
        "criteria": {
          "cost": 78,
          "quality": 92,
          "delivery": 88,
          "reliability": 91,
          "risk": 85
        }
      },
      {
        "id": "opt-b",
        "name": "Supplier B",
        "criteria": {
          "cost": 90,
          "quality": 82,
          "delivery": 94,
          "reliability": 85,
          "risk": 78
        }
      }
    ],
    "criteria": [
      { "key": "cost", "name": "Cost", "weight": 20 },
      { "key": "quality", "name": "Quality", "weight": 30 },
      { "key": "delivery", "name": "Delivery", "weight": 20 },
      { "key": "reliability", "name": "Reliability", "weight": 20 },
      { "key": "risk", "name": "Risk", "weight": 10 }
    ],
    "weights": {
      "cost": 20,
      "quality": 30,
      "delivery": 20,
      "reliability": 20,
      "risk": 10
    }
  }'
```

4. Check the n8n execution log
5. You should see output through all 7 nodes

---

### Test via Backend

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173`
4. Click **"Explore Supplier Demo"**
5. The decision should load with AI analysis
6. Check n8n execution history to verify the workflow ran

---

## Expected Response Format

```json
{
  "success": true,
  "data": {
    "recommendation": {
      "option": "Supplier A",
      "score": 87.5
    },
    "confidence": 87,
    "confidenceCategory": "High Confidence",
    "summary": "Supplier A achieves the highest overall score...",
    "reasons": [
      "Superior quality rating (92)",
      "Strong reliability performance"
    ],
    "evidence": [
      {
        "factor": "Quality",
        "value": 92,
        "impact": "positive",
        "explanation": "..."
      }
    ],
    "risks": [
      {
        "risk": "Cost disadvantage",
        "severity": "medium",
        "explanation": "..."
      }
    ],
    "alternatives": [
      {
        "option": "Supplier B",
        "score": 84.1,
        "reason": "Strong cost performance"
      }
    ],
    "tradeoffs": [
      "Supplier A provides quality but costs more"
    ],
    "source": "n8n_groq"
  },
  "calculatedScores": [
    { "name": "Supplier A", "score": 87.5, "rank": 1 },
    { "name": "Supplier B", "score": 84.1, "rank": 2 }
  ]
}
```

---

## Troubleshooting

### Webhook Returns 404

- Verify the workflow is **Active**
- Check the webhook path matches `/decision-analysis`
- Ensure n8n is running

### Groq API Error

- Verify `GROQ_API_KEY` environment variable is set
- Check API key is valid
- Ensure you have Groq API credits
- Check network connectivity to `api.groq.com`

### Invalid JSON Response

- Check the **Groq AI HTTP Request** node has `response_format: { type: 'json_object' }`
- Verify the system prompt is correctly formatted
- Check execution logs in n8n

### Backend Can't Reach n8n

- Ensure n8n is running on the correct port
- Check `N8N_WEBHOOK_URL` in backend `.env`
- If using Docker, ensure ports are mapped correctly

---

## Production Deployment

### Secure the Webhook

In production, secure your n8n webhook:

1. Enable authentication on the webhook node
2. Use HTTPS instead of HTTP
3. Set up rate limiting
4. Use environment variables for all secrets

### Cloud n8n

If using n8n Cloud:

1. Get your webhook URL from n8n Cloud
2. Update `N8N_WEBHOOK_URL` in backend `.env`
3. Ensure backend can reach the cloud URL

### Environment Variables

For production:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/decision-analysis
GROQ_API_KEY=your_production_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## Alternative: Backend Fallback

The backend includes a **resilient fallback system**:

1. **Primary**: n8n webhook
2. **Fallback 1**: Direct Groq API call (if `GROQ_API_KEY` is set in backend)
3. **Fallback 2**: Deterministic engine (no AI, pure math)

If n8n is unavailable, decisions will still work using the fallback logic.

---

## Monitoring

### Check n8n Executions

1. Go to **Executions** in n8n sidebar
2. View successful/failed workflow runs
3. Inspect input/output for each node
4. Use execution logs for debugging

### Backend Logs

The backend logs n8n communication:

```
[n8nService] Dispatching decision payload to n8n webhook: http://localhost:5678/webhook/decision-analysis
[n8nService] Successfully received AI analysis from n8n webhook.
```

Or if fallback:

```
[n8nService] n8n webhook error (...). Proceeding with resilient fallback.
[n8nService] Querying Groq API directly...
```

---

## Summary

✅ Import workflow JSON  
✅ Configure Groq API key  
✅ Activate workflow  
✅ Set `N8N_WEBHOOK_URL` in backend  
✅ Test with curl or via frontend  
✅ Monitor executions in n8n  

**The system is now fully operational!**

---

## Support

- n8n Documentation: https://docs.n8n.io
- Groq API Documentation: https://console.groq.com/docs
- Project Issues: Check the main README.md
