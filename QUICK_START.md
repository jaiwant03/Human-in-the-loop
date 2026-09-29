# Quick Start Guide

Get the Human-in-the-Loop Decision Intelligence Platform running in **5 minutes**.

---

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community) or use [Atlas](https://www.mongodb.com/cloud/atlas))
- **Groq API Key** ([Get one free](https://console.groq.com/))

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd Human-in-the-loop

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Step 2: Configure Environment

### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hitl_decision_intelligence
N8N_WEBHOOK_URL=http://localhost:5678/webhook/decision-analysis
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

**Important**:
- If using **local MongoDB**: Keep `MONGO_URI` as shown
- If using **MongoDB Atlas**: Replace with your Atlas connection string
- Add your **Groq API key**

---

## Step 3: Start MongoDB

### Option A: Local MongoDB

```bash
# Start MongoDB service
mongod
```

### Option B: MongoDB Atlas

No local MongoDB needed — just use your Atlas URI in `.env`

---

## Step 4: Start n8n (Optional but Recommended)

```bash
# Set your Groq API key
export GROQ_API_KEY="your_groq_api_key_here"

# Windows PowerShell
$env:GROQ_API_KEY="your_groq_api_key_here"

# Start n8n
npx n8n
```

n8n will open at: **http://localhost:5678**

### Import the Workflow

1. In n8n, click **Workflows** → **Add Workflow**
2. Click the three-dot menu (⋮) → **Import from File**
3. Select `n8n/Decision_Intelligence_Workflow.json`
4. Click the **Inactive** toggle to **Activate** the workflow

✅ Workflow is now ready!

**Note**: If you skip n8n, the system will use the built-in fallback (direct Groq API or deterministic engine).

---

## Step 5: Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
🚀 HITL Decision Intelligence Server is running!
📡 URL: http://localhost:5000
⚖️  Philosophy: AI recommends → Humans decide.
```

---

## Step 6: Start Frontend

Open a **new terminal**:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v8.3.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

## Step 7: Open the Application

Open your browser: **http://localhost:5173**

You should see the landing page with:
- "Human-in-the-Loop Decision Intelligence" heading
- White background with green accents
- "Explore Supplier Demo" button

---

## Step 8: Test the Demo

### Quick Test

1. Click **"Explore Supplier Demo"** or **"Supplier Demo"** in the navbar
2. The system will:
   - Load the canonical supplier selection decision
   - Send it to n8n (or fallback)
   - Get AI analysis from Groq
   - Display the recommendation
3. You should see:
   - **AI Recommendation**: Supplier A (87.5/100)
   - **Confidence**: ~87%
   - **Evidence**, **Risks**, **Alternatives**
   - **Human Decision Panel** with 3 options

### Make a Decision

1. Choose one of:
   - **Accept AI Recommendation**
   - **Select Alternative** (choose Supplier B)
   - **Override AI** (requires entering a reason)
2. Click **"Confirm Final Decision"**
3. Your decision is saved!

### View Results

- Click **"Audit Trail"** or **"Dashboard"** in the navbar
- See your decision recorded with:
  - AI recommendation
  - Your final decision
  - Decision type
  - Timestamp

---

## Troubleshooting

### Backend won't start

**Problem**: `Error: connect ECONNREFUSED`  
**Solution**: Ensure MongoDB is running

**Problem**: Port 5000 already in use  
**Solution**: Change `PORT` in `backend/.env` to another port (e.g., 5001)

### Frontend shows errors

**Problem**: `Network Error`  
**Solution**: Check that backend is running on http://localhost:5000

### n8n not working

**Problem**: Webhook returns 404  
**Solution**: 
- Verify the workflow is **Active** (toggle in top-right)
- Check webhook URL matches `N8N_WEBHOOK_URL` in backend `.env`

**Problem**: Groq API error  
**Solution**:
- Verify `GROQ_API_KEY` environment variable is set before starting n8n
- Check you have credits in your Groq account

### AI Analysis not appearing

**Don't worry!** The system has fallbacks:

1. **n8n unavailable?** → Backend calls Groq directly
2. **Groq unavailable?** → Backend uses deterministic engine (pure math)

You'll still see scores and can make decisions.

---

## Verify n8n Integration

To confirm n8n is working:

1. Open n8n at http://localhost:5678
2. Click **Executions** in the sidebar
3. You should see a successful execution after creating a decision
4. Click on it to see the data flow through all 7 nodes

---

## What-If Simulator

Test the What-If feature:

1. From a decision page, click **"What-If Simulator"**
2. Adjust the **Cost** weight to **40%**
3. Adjust **Quality** to **20%**
4. Click **"Recalculate Simulation"**
5. Watch **Supplier B** take the lead!
6. This demonstrates how changing priorities affects the recommendation

---

## Next Steps

### Explore the Application

- **Dashboard**: View statistics and charts
- **Create Decision**: Build your own decision
- **Decision History**: See all decisions
- **Decision Details**: View full audit trail

### Read the Documentation

- **README.md**: Full project overview
- **docs/N8N_SETUP.md**: Comprehensive n8n guide
- **IMPLEMENTATION_SUMMARY.md**: Technical details

### Customize

- Add your own decision categories
- Adjust scoring algorithms in `backend/services/scoringService.js`
- Customize the UI colors in `frontend/src/styles/global.css`

---

## Architecture Reminder

```
React (localhost:5173)
    ↓
Express (localhost:5000)
    ↓
n8n (localhost:5678) → Groq API
    ↓
Express
    ↓
MongoDB (localhost:27017)
```

---

## Quick Commands Reference

```bash
# Start MongoDB (local)
mongod

# Start n8n
export GROQ_API_KEY="your_key"
npx n8n

# Start Backend
cd backend
npm run dev

# Start Frontend
cd frontend
npm run dev

# Check Backend Health
curl http://localhost:5000/api/health
```

---

## Support

- **n8n Issues**: Check [docs/N8N_SETUP.md](docs/N8N_SETUP.md)
- **Backend Issues**: Check logs in terminal
- **Frontend Issues**: Check browser console (F12)

---

## Success Criteria

✅ Frontend loads at http://localhost:5173  
✅ Backend responds at http://localhost:5000/api/health  
✅ Can click "Supplier Demo" and see AI recommendation  
✅ Can make a human decision (Accept/Override/Alternative)  
✅ Decision appears in History  
✅ Dashboard shows statistics  

**If all checkmarks pass → You're ready to demo! 🎉**

---

## Philosophy

> **AI recommends. Humans decide.**

This platform ensures the human always has the final say. The AI provides analysis, evidence, confidence, and alternatives — but never makes the decision automatically.

**Enjoy exploring Human-in-the-Loop Decision Intelligence!**
