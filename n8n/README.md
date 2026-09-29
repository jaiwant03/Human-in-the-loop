# n8n Decision Intelligence Workflow Guide

This directory contains the production-ready n8n workflow for the **Human-in-the-Loop Decision Intelligence Platform**.

## Overview

The n8n workflow serves as the central AI orchestration and automation layer between the Node.js backend and the Groq LLM API.

```
Node.js Backend (HTTP POST)
         ↓
n8n Webhook Entry Point (`/webhook/decision-analysis`)
         ↓
Input Validation Node
         ↓
Deterministic Scoring & Normalization (Code Node)
         ↓
Prepare Groq Prompt (System Prompt + Grounded Data)
         ↓
Groq AI HTTP Request (`api.groq.com/openai/v1/chat/completions`)
         ↓
Parse & Confidence Validation (Formula: Completeness, Separation, Strength, Coverage)
         ↓
Respond to Webhook (Structured JSON Response)
         ↓
Node.js Backend → MongoDB → React Dashboard
```

## How to Import into n8n

1. Open your running n8n instance (typically `http://localhost:5678`).
2. Click **Workflows** in the left sidebar → **Import from File...**
3. Select `n8n/Decision_Intelligence_Workflow.json`.
4. The workflow **"Decision Intelligence Workflow"** will load on the canvas.

## Configuring Credentials & Environment Variables

### In n8n:
- Set up a generic HTTP Header Auth credential named **Groq API Header** with:
  - Header Name: `Authorization`
  - Header Value: `Bearer <YOUR_GROQ_API_KEY>`
- Alternatively, launch n8n with environment variables:
  ```bash
  GROQ_API_KEY=gsk_your_groq_api_key_here n8n start
  ```
- Or set `GROQ_MODEL`:
  - `llama-3.3-70b-versatile` (Recommended)
  - `llama-3.1-8b-instant`
  - `mixtral-8x7b-32768`

### In Backend `.env`:
Point the `N8N_WEBHOOK_URL` to your active webhook node:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/decision-analysis
```

## Workflow Guarantees

1. **Deterministic Grounding**: The LLM is never permitted to invent scores. All rankings are mathematically derived and passed into the prompt.
2. **Strict Schema**: Groq is instructed to return `json_object` format matching the platform's evidence and risk model.
3. **Analytical Confidence Calculation**: Confidence is calculated deterministically via:
   $$\text{Confidence} = (\text{Data Completeness} \times 0.3) + (\text{Score Separation} \times 0.3) + (\text{Evidence Strength} \times 0.2) + (\text{Criteria Coverage} \times 0.2)$$
4. **Resilient Fallback**: If n8n is offline or unreachable, the Node.js backend automatically falls back to direct Groq or its internal deterministic reasoning engine, guaranteeing continuous operation.
