/**
 * Auto-Import Script: Decision Intelligence Workflow → n8n
 *
 * Usage:
 *   node scripts/import-n8n-workflow.js
 *   node scripts/import-n8n-workflow.js --api-key YOUR_N8N_API_KEY
 *
 * What it does:
 *  1. Connects to your local n8n instance (http://localhost:5678)
 *  2. Checks if the workflow already exists
 *  3. Creates or updates the workflow via n8n REST API
 *  4. Activates it so the webhook is live
 *  5. Tests the webhook with a sample payload
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env from backend/.env directly without dotenv dependency
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', 'backend', '.env');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.substring(0, eq).trim();
      const val = trimmed.substring(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) {
    console.warn('Could not read backend/.env:', e.message);
  }
}
loadEnv();

const N8N_BASE = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.argv.find(a => a.startsWith('--api-key='))?.split('=')[1]
  || process.env.N8N_API_KEY
  || '';

const WORKFLOW_FILE = path.join(__dirname, '..', 'n8n', 'Decision_Intelligence_Workflow.json');

// ── Simple HTTP helper ──────────────────────────────────────────
function request(method, urlStr, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : undefined;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders,
    };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (N8N_API_KEY) headers['X-N8N-API-KEY'] = N8N_API_KEY;

    const req = lib.request({
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers,
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Build the workflow JSON payload ────────────────────────────
function buildWorkflow(groqKey, groqModel) {
  const model = groqModel || 'llama-3.3-70b-versatile';

  const validateCode = `
const body = $input.first().json.body || $input.first().json;
if (!body.title) throw new Error('Validation: title required');
if (!body.options || body.options.length < 2) throw new Error('Validation: need >= 2 options');
if (!body.criteria || body.criteria.length < 2) throw new Error('Validation: need >= 2 criteria');
const weights = body.weights || {};
let total = 0;
for (const c of body.criteria) { total += parseFloat(weights[c.key] || 0); }
if (total < 98 || total > 102) throw new Error('Validation: weights must sum to 100%. Got: ' + Math.round(total));
for (const opt of body.options) {
  for (const c of body.criteria) {
    const v = (opt.criteria || {})[c.key];
    if (v === undefined || v === null || isNaN(parseFloat(v))) throw new Error('Validation: missing value for ' + opt.name + ' / ' + c.name);
    if (parseFloat(v) < 0 || parseFloat(v) > 100) throw new Error('Validation: score out of range for ' + opt.name + ' / ' + c.name);
  }
}
return [{ json: body }];
`.trim();

  const scoringCode = `
const data = $input.first().json;
const criteria = data.criteria;
const weights = data.weights || {};
let total = 0;
for (const c of criteria) total += parseFloat(weights[c.key] || 0);
if (total === 0) total = 100;
const scored = data.options.map(opt => {
  let score = 0; const breakdown = {};
  const oc = opt.criteria || {};
  for (const c of criteria) {
    const val = parseFloat(oc[c.key] || 0);
    const w = parseFloat(weights[c.key] || 0) / total;
    const contrib = val * w;
    breakdown[c.key] = Math.round(contrib * 100) / 100;
    score += contrib;
  }
  return { name: opt.name, weightedScore: Math.round(score * 10) / 10, breakdown, rawCriteria: oc };
});
scored.sort((a, b) => b.weightedScore - a.weightedScore);
scored.forEach((s, i) => { s.rank = i + 1; });
const top = scored[0];
const runner = scored[1] || null;
const allKeys = criteria.map(c => c.key);
const strongCount = allKeys.filter(k => parseFloat(top.rawCriteria[k] || 0) >= 75).length;
const strength = criteria.length > 0 ? strongCount / criteria.length : 0.5;
const sep = runner ? Math.min(1, Math.max(0.05, (top.weightedScore - runner.weightedScore) / 15)) : 0.5;
const cov = Math.min(1, Math.max(0.4, criteria.length / 5));
const conf = Math.min(96, Math.max(45, Math.round(30 + (sep * 30) + (strength * 20) + (cov * 20))));
const confCat = conf >= 80 ? 'High Confidence' : conf >= 60 ? 'Medium Confidence' : 'Low Confidence';
return [{ json: { ...data, scored, topOption: top, runnerUp: runner, analyticalConfidence: { score: conf, category: confCat, level: conf >= 80 ? 'High' : conf >= 60 ? 'Medium' : 'Low', explanation: 'Based on data completeness, score separation and criteria coverage.' } } }];
`.trim();

  const promptCode = `
const item = $input.first().json;
const top = item.topOption;
const runner = item.runnerUp;
const sys = \`You are an explainable decision-support AI. You are NOT the final decision-maker.
A deterministic engine has already calculated scores. Use them as ground truth.
Do NOT recalculate or change any scores.
Return ONLY valid JSON:
{
  "recommendation":{"option":"<rank 1 name>","score":<number>},
  "summary":"<2-3 sentence explanation>",
  "reasons":["<reason 1>","<reason 2>"],
  "evidence":[{"factor":"<criterion>","value":<0-100>,"impact":"positive|negative|neutral","explanation":"<sentence>"}],
  "risks":[{"risk":"<title>","severity":"low|medium|high","explanation":"<sentence>"}],
  "alternatives":[{"option":"<name>","score":<number>,"reason":"<sentence>"}],
  "tradeoffs":["<tradeoff>"]
}\`;
const criTable = item.criteria.map(c => c.name + ': ' + (item.weights[c.key] || 0) + '%').join(', ');
const scTable = item.scored.map(s => 'Rank ' + s.rank + ': ' + s.name + ' = ' + s.weightedScore).join('\\n');
const usr = 'Decision: ' + item.title + '\\nCategory: ' + item.category + '\\nCriteria: ' + criTable + '\\nScores:\\n' + scTable + '\\nTop option: ' + top.name + ' (' + top.weightedScore + ')\\nrecommendation.option MUST be "' + top.name + '" and score MUST be ' + top.weightedScore;
return [{ json: { ...item, _messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }] } }];
`.trim();

  const parseCode = `
const gr = $input.first().json;
const prev = $('Deterministic Scoring').first().json;
let ai = {};
try {
  const raw = gr.choices[0].message.content;
  ai = typeof raw === 'string' ? JSON.parse(raw) : raw;
} catch(e) {
  ai = { summary: 'AI parse error — deterministic scores are authoritative.', reasons: [], evidence: [], risks: [], alternatives: [], tradeoffs: [] };
}
const top = prev.topOption;
const runner = prev.runnerUp;
const conf = prev.analyticalConfidence;
ai.recommendation = { option: top.name, score: top.weightedScore };
if (!Array.isArray(ai.evidence) || ai.evidence.length === 0) {
  ai.evidence = top.criteriaDetail ? top.criteriaDetail.map(cd => ({ factor: cd.criterion || cd.key, value: cd.rawScore || 0, impact: (cd.rawScore || 0) >= 75 ? 'positive' : 'negative', explanation: top.name + ' scored ' + (cd.rawScore || 0) + ' on ' + (cd.criterion || cd.key) + '.' })) : [];
}
if (!Array.isArray(ai.risks) || ai.risks.length === 0) {
  ai.risks = [{ risk: 'Score Margin', severity: 'low', explanation: runner ? runner.name + ' is a close runner-up at ' + runner.weightedScore + '.' : 'No close competitor identified.' }];
}
if (!Array.isArray(ai.alternatives) || ai.alternatives.length === 0) {
  ai.alternatives = runner ? [{ option: runner.name, score: runner.weightedScore, reason: 'Runner-up — consider if priorities shift.' }] : [];
} else {
  ai.alternatives = ai.alternatives.filter(a => a.option !== top.name).map(a => { const m = prev.scored.find(s => s.name === a.option); return { option: a.option, score: m ? m.weightedScore : a.score, reason: a.reason || 'Viable alternative.' }; });
}
if (!Array.isArray(ai.reasons) || ai.reasons.length === 0) ai.reasons = ['Highest weighted score: ' + top.weightedScore + '/100'];
if (!ai.summary) ai.summary = top.name + ' ranks #1 with a weighted score of ' + top.weightedScore + '/100.';
if (!Array.isArray(ai.tradeoffs)) ai.tradeoffs = [];
ai.confidence = conf.score;
ai.confidenceCategory = conf.category;
ai.source = 'n8n_groq';
ai.analyzedAt = new Date().toISOString();
const final = {
  success: true,
  decisionId: prev.decisionId || null,
  recommendation: ai.recommendation,
  confidence: { score: conf.score, level: conf.level, category: conf.category, explanation: conf.explanation },
  calculatedScores: prev.scored.map(s => ({ option: s.name, score: s.weightedScore, rank: s.rank })),
  aiAnalysis: { recommendation: ai.recommendation, confidence: conf.score, confidenceCategory: conf.category, summary: ai.summary, reasons: ai.reasons, evidence: ai.evidence, risks: ai.risks, alternatives: ai.alternatives, tradeoffs: ai.tradeoffs, source: 'n8n_groq', analyzedAt: ai.analyzedAt },
  humanDecisionRequired: true
};
return [{ json: final }];
`.trim();

  return {
    name: 'Decision Intelligence Workflow',
    nodes: [
      {
        id: 'a1b2c3d4-0001-4e5f-a678-111111111111',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [200, 300],
        parameters: {
          httpMethod: 'POST',
          path: 'decision-analysis',
          responseMode: 'responseNode',
          options: {},
        },
        webhookId: 'hitl-decision-analysis-v1',
      },
      {
        id: 'a1b2c3d4-0002-4e5f-a678-222222222222',
        name: 'Validate Input',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [440, 300],
        parameters: { jsCode: validateCode },
      },
      {
        id: 'a1b2c3d4-0003-4e5f-a678-333333333333',
        name: 'Deterministic Scoring',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [680, 300],
        parameters: { jsCode: scoringCode },
      },
      {
        id: 'a1b2c3d4-0004-4e5f-a678-444444444444',
        name: 'Prepare Groq Prompt',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [920, 300],
        parameters: { jsCode: promptCode },
      },
      {
        id: 'a1b2c3d4-0005-4e5f-a678-555555555555',
        name: 'Groq AI',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1160, 300],
        parameters: {
          method: 'POST',
          url: 'https://api.groq.com/openai/v1/chat/completions',
          authentication: 'genericCredentialType',
          genericAuthType: 'httpHeaderAuth',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Authorization', value: `Bearer ${groqKey}` },
              { name: 'Content-Type',  value: 'application/json' },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={"model":"${model}","messages":{{ JSON.stringify($json._messages) }},"response_format":{"type":"json_object"},"temperature":0.2,"max_tokens":2048}`,
          options: { timeout: 30000 },
        },
      },
      {
        id: 'a1b2c3d4-0006-4e5f-a678-666666666666',
        name: 'Parse & Validate AI Response',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1400, 300],
        parameters: { jsCode: parseCode },
      },
      {
        id: 'a1b2c3d4-0007-4e5f-a678-777777777777',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1,
        position: [1640, 300],
        parameters: {
          respondWith: 'json',
          responseBody: '={{ JSON.stringify($json) }}',
          options: { responseCode: 200 },
        },
      },
    ],
    connections: {
      Webhook:                       { main: [[{ node: 'Validate Input',            type: 'main', index: 0 }]] },
      'Validate Input':              { main: [[{ node: 'Deterministic Scoring',     type: 'main', index: 0 }]] },
      'Deterministic Scoring':       { main: [[{ node: 'Prepare Groq Prompt',       type: 'main', index: 0 }]] },
      'Prepare Groq Prompt':         { main: [[{ node: 'Groq AI',                   type: 'main', index: 0 }]] },
      'Groq AI':                     { main: [[{ node: 'Parse & Validate AI Response', type: 'main', index: 0 }]] },
      'Parse & Validate AI Response':{ main: [[{ node: 'Respond to Webhook',        type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1', saveManualExecutions: true },
    active: true,
  };
}

// ── Test payload ────────────────────────────────────────────────
const TEST_PAYLOAD = {
  decisionId: 'test-import-001',
  title: 'Choose the Best Laptop',
  description: 'Select the best laptop for our development team.',
  category: 'Product Selection',
  options: [
    { id: 'opt-1', name: 'Laptop A', criteria: { price: 80, performance: 95, battery: 90 } },
    { id: 'opt-2', name: 'Laptop B', criteria: { price: 90, performance: 85, battery: 85 } },
    { id: 'opt-3', name: 'Laptop C', criteria: { price: 75, performance: 80, battery: 80 } },
  ],
  criteria: [
    { key: 'price',       name: 'Price',       weight: 30 },
    { key: 'performance', name: 'Performance', weight: 40 },
    { key: 'battery',     name: 'Battery',     weight: 30 },
  ],
  weights: { price: 30, performance: 40, battery: 30 },
};

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Decision Intelligence Workflow — n8n Auto-Import Tool');
  console.log('═══════════════════════════════════════════════════════\n');

  const groqKey   = process.env.GROQ_API_KEY || '';
  const groqModel = process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile';

  if (!groqKey) {
    console.error('✗ GROQ_API_KEY not found in backend/.env\n  Add it and re-run.\n');
    process.exit(1);
  }
  console.log(`✓ Groq API Key found: ${groqKey.substring(0, 10)}...`);
  console.log(`✓ Groq Model: ${groqModel}`);

  // 1. Check n8n health
  console.log(`\n[1/5] Checking n8n at ${N8N_BASE}...`);
  try {
    const health = await request('GET', `${N8N_BASE}/healthz`);
    if (health.data?.status === 'ok') {
      console.log('✓ n8n is running');
    } else {
      throw new Error('Unexpected health response');
    }
  } catch (e) {
    console.error(`✗ Cannot reach n8n at ${N8N_BASE}`);
    console.error('  Make sure n8n is running: npx n8n start\n');
    process.exit(1);
  }

  // 2. Check API key
  if (N8N_API_KEY) {
    console.log(`\n[2/5] Testing n8n API key...`);
    try {
      const test = await request('GET', `${N8N_BASE}/api/v1/workflows`);
      if (test.status === 200) {
        console.log('✓ n8n API key is valid');
      } else if (test.status === 401) {
        console.warn('⚠ API key invalid — will try without auth (may fail)');
      }
    } catch (e) {
      console.warn('⚠ Could not verify API key');
    }
  } else {
    console.log('\n[2/5] No N8N_API_KEY provided — trying without auth');
    console.log('  If import fails, set N8N_API_KEY env var and re-run.');
    console.log('  Find your key in n8n → Settings → API → Create API Key');
  }

  // 3. Check for existing workflow
  console.log('\n[3/5] Checking for existing workflow...');
  let existingId = null;
  try {
    const list = await request('GET', `${N8N_BASE}/api/v1/workflows?limit=50`);
    if (list.status === 200 && Array.isArray(list.data?.data)) {
      const found = list.data.data.find(w => w.name === 'Decision Intelligence Workflow');
      if (found) {
        existingId = found.id;
        console.log(`✓ Found existing workflow (id: ${existingId}) — will update`);
      } else {
        console.log('✓ No existing workflow found — will create new');
      }
    } else if (list.status === 401) {
      console.warn('⚠ n8n API requires authentication');
      console.log('  Attempting workflow import via file (manual method)...');
      await manualFileMethod(groqKey, groqModel);
      return;
    }
  } catch (e) {
    console.warn(`⚠ Could not list workflows: ${e.message}`);
  }

  // 4. Create or update workflow
  console.log('\n[4/5] Importing workflow...');
  const workflow = buildWorkflow(groqKey, groqModel);

  try {
    let result;
    if (existingId) {
      result = await request('PUT', `${N8N_BASE}/api/v1/workflows/${existingId}`, workflow);
    } else {
      result = await request('POST', `${N8N_BASE}/api/v1/workflows`, workflow);
    }

    if (result.status === 200 || result.status === 201) {
      const wfId = result.data?.data?.id || result.data?.id;
      console.log(`✓ Workflow ${existingId ? 'updated' : 'created'} (id: ${wfId})`);

      // Activate it
      if (wfId) {
        try {
          await request('PATCH', `${N8N_BASE}/api/v1/workflows/${wfId}`, { active: true });
          console.log('✓ Workflow activated');
        } catch { console.warn('⚠ Could not activate — activate manually in n8n UI'); }
      }
    } else {
      console.error(`✗ Import failed (HTTP ${result.status}):`);
      console.error(JSON.stringify(result.data, null, 2));
      console.log('\n→ Trying manual file method...');
      await manualFileMethod(groqKey, groqModel);
      return;
    }
  } catch (e) {
    console.error(`✗ Import error: ${e.message}`);
    await manualFileMethod(groqKey, groqModel);
    return;
  }

  // 5. Test the webhook
  console.log('\n[5/5] Testing webhook...');
  await testWebhook();
}

async function testWebhook() {
  try {
    console.log('  Sending test payload to webhook...');
    const res = await request('POST', `${N8N_BASE}/webhook/decision-analysis`, TEST_PAYLOAD);
    if (res.status === 200 && res.data?.success) {
      const top = res.data.calculatedScores?.[0];
      console.log('✓ Webhook test PASSED!');
      console.log(`  Top option: ${top?.option || top?.name} (score: ${top?.score})`);
      console.log(`  Confidence: ${res.data.confidence?.score}% (${res.data.confidence?.level})`);
      console.log(`  Source: ${res.data.aiAnalysis?.source}`);
    } else if (res.status === 404) {
      console.warn('⚠ Webhook returned 404 — workflow may not be active yet');
      console.log('  Open n8n at http://localhost:5678, find the workflow, and click "Active"');
    } else {
      console.warn(`⚠ Webhook returned HTTP ${res.status}:`);
      console.log(JSON.stringify(res.data, null, 2).substring(0, 400));
    }
  } catch (e) {
    console.warn(`⚠ Webhook test error: ${e.message}`);
  }

  printSummary();
}

async function manualFileMethod(groqKey, groqModel) {
  console.log('\n═══════════════════════════════════');
  console.log('  MANUAL IMPORT METHOD');
  console.log('═══════════════════════════════════');
  console.log('\nAPI auth failed. Use the n8n UI to import the workflow:');
  console.log('\n  1. Open http://localhost:5678');
  console.log('  2. Click "Create workflow" (orange button)');
  console.log('  3. Click the ⋮ menu → "Import from file..."');
  console.log('  4. Select: n8n/Decision_Intelligence_Workflow_WithKey.json');
  console.log('     (being generated now with your API key embedded)');
  console.log('  5. Click "Inactive" toggle → set to Active\n');

  // Write a ready-to-import file with the key embedded
  const workflow = buildWorkflow(groqKey, groqModel);
  const outPath = path.join(__dirname, '..', 'n8n', 'Decision_Intelligence_Workflow_WithKey.json');
  fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2), 'utf8');
  console.log(`✓ Generated: ${outPath}`);
  console.log('  Import this file in n8n UI to complete setup.\n');

  printSummary();
}

function printSummary() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n  Your backend is already working with direct Groq API.');
  console.log('  n8n adds: structured pipeline, validation, audit nodes.');
  console.log('\n  Webhook URL: http://localhost:5678/webhook/decision-analysis');
  console.log('  Backend:     http://localhost:5000');
  console.log('  Frontend:    http://localhost:5173');
  console.log('\n  Flow priority:');
  console.log('    1. n8n webhook (if active)');
  console.log('    2. Direct Groq API (GROQ_API_KEY set ✓)');
  console.log('    3. Deterministic engine (offline fallback)');
  console.log('\n  Start backend:  cd backend && npm run dev');
  console.log('  Start frontend: cd frontend && npm run dev');
  console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch(e => {
  console.error('\n✗ Fatal error:', e.message);
  process.exit(1);
});
