# EXACT STEPS TO SET UP THE WORKFLOW IN YOUR n8n

You already have n8n running (I can see it in your screenshot at http://localhost:5678).

---

## STEP 1 — Create the Groq Credential

> This must be done BEFORE importing the workflow.

1. In n8n, click **"Credentials"** in the left sidebar
2. Click **"+ Add credential"** (top right)
3. In the search box, type: `Header Auth`
4. Click **"Header Auth"**
5. Fill in:
   ```
   Credential Name:  Groq API Key
   Name:             Authorization
   Value:            Bearer gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   *(Replace with your actual Groq key from https://console.groq.com/keys)*
6. Click **"Save"**

---

## STEP 2 — Import the Workflow

1. Click **"Workflows"** in the left sidebar
2. Click **"+ Add workflow"** or the **"Create workflow"** orange button
3. In the empty canvas, click the **⋮ menu** (top-right corner of canvas)
4. Select **"Import from file..."**
5. Browse to and select:
   ```
   d:\Dev\Projects\Human-in-the-loop\n8n\Decision_Intelligence_Workflow.json
   ```
6. The workflow loads with 7 nodes

---

## STEP 3 — Connect Credential to the Groq Node

1. Click on the **"Groq AI"** node (the HTTP Request node in the middle of the canvas)
2. In the panel that opens on the right:
   - Find **"Authentication"** → set to **"Generic Credential Type"**
   - Find **"Generic Auth Type"** → set to **"Header Auth"**
   - Find **"Credential for Header Auth"** → select **"Groq API Key"**
3. Click **"Save"** or close the panel

---

## STEP 4 — Activate

1. Click the **"Inactive"** toggle in the top-right corner of the canvas
2. It turns green → **"Active"**
3. The webhook URL is now live:
   ```
   http://localhost:5678/webhook/decision-analysis
   ```

---

## STEP 5 — Confirm Backend .env

Your `backend/.env` should have:
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/decision-analysis
```
*(This is already set correctly in your current .env)*

---

## STEP 6 — Quick Test

Paste this in your terminal to test the workflow directly:

### Windows PowerShell:
```powershell
$body = @{
  decisionId = "test-001"
  title = "Choose the Best Laptop"
  description = "Select the best laptop for our team."
  category = "Product Selection"
  options = @(
    @{ id="opt-1"; name="Laptop A"; criteria=@{ price=80; performance=95; battery=90 } },
    @{ id="opt-2"; name="Laptop B"; criteria=@{ price=90; performance=85; battery=85 } },
    @{ id="opt-3"; name="Laptop C"; criteria=@{ price=75; performance=80; battery=80 } }
  )
  criteria = @(
    @{ key="price";       name="Price";       weight=30 },
    @{ key="performance"; name="Performance"; weight=40 },
    @{ key="battery";     name="Battery";     weight=30 }
  )
  weights = @{ price=30; performance=40; battery=30 }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:5678/webhook/decision-analysis" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Or in terminal with curl:
```bash
curl -X POST http://localhost:5678/webhook/decision-analysis \
  -H "Content-Type: application/json" \
  -d "{\"decisionId\":\"test-001\",\"title\":\"Choose the Best Laptop\",\"description\":\"Select the best laptop.\",\"category\":\"Product Selection\",\"options\":[{\"id\":\"opt-1\",\"name\":\"Laptop A\",\"criteria\":{\"price\":80,\"performance\":95,\"battery\":90}},{\"id\":\"opt-2\",\"name\":\"Laptop B\",\"criteria\":{\"price\":90,\"performance\":85,\"battery\":85}},{\"id\":\"opt-3\",\"name\":\"Laptop C\",\"criteria\":{\"price\":75,\"performance\":80,\"battery\":80}}],\"criteria\":[{\"key\":\"price\",\"name\":\"Price\",\"weight\":30},{\"key\":\"performance\",\"name\":\"Performance\",\"weight\":40},{\"key\":\"battery\",\"name\":\"Battery\",\"weight\":30}],\"weights\":{\"price\":30,\"performance\":40,\"battery\":30}}"
```

**You should get back JSON with `"success": true` and the AI analysis.**

---

## What Each Node Does

```
[Webhook]
  Receives POST from Express backend at /webhook/decision-analysis

[Validate Input]
  Checks: title, options≥2, criteria≥2, weights sum≈100%
  If invalid → throws error → n8n returns error response

[Deterministic Scoring]
  Calculates weighted scores MATHEMATICALLY
  score = sum(criterionValue × criterionWeight)
  AI never sees this calculation — it only gets the results

[Prepare Groq Prompt]
  Builds: system prompt (role + instructions + JSON schema)
  Builds: user prompt (decision context + deterministic scores as ground truth)

[Groq AI]
  Sends to: https://api.groq.com/openai/v1/chat/completions
  Model: llama-3.3-70b-versatile
  Format: json_object (forces valid JSON)
  Explains results — never recalculates scores

[Parse & Validate AI Response]
  Enforces: top option = deterministic winner (AI cannot override this)
  Cleans: evidence, risks, alternatives
  Calculates: confidence from completeness + separation + coverage
  Adds: humanDecisionRequired: true (the human MUST decide)

[Respond to Webhook]
  Returns structured JSON to Express backend
```

---

## Checklist

- [ ] Groq credential created with `Authorization: Bearer gsk_...`
- [ ] Workflow imported from `n8n/Decision_Intelligence_Workflow.json`
- [ ] "Groq AI" node connected to "Groq API Key" credential
- [ ] Workflow set to **Active**
- [ ] `backend/.env` has `N8N_WEBHOOK_URL=http://localhost:5678/webhook/decision-analysis`
- [ ] Test curl/PowerShell returns `"success": true`
- [ ] n8n Executions tab shows green executions
