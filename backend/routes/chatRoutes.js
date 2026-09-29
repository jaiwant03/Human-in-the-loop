const express = require('express');
const router = express.Router();
const { analyzeFromChat, chatMessage, quickAnalyze } = require('../controllers/chatController');

// POST /api/chat/analyze  — parse NL message → full decision analysis via n8n/Groq
router.post('/analyze', analyzeFromChat);

// POST /api/chat/message  — follow-up Q&A about a decision
router.post('/message', chatMessage);

// POST /api/chat/quick    — lightweight parse + score, no DB save
router.post('/quick', quickAnalyze);

module.exports = router;
