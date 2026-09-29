import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

export const decisionAPI = {
  // Get all decisions with optional filters
  getDecisions: async (params = {}) => {
    const res = await apiClient.get('/decisions', { params });
    return res.data;
  },

  // Get decision by ID
  getDecisionById: async (id) => {
    const res = await apiClient.get(`/decisions/${id}`);
    return res.data;
  },

  // Create a new decision
  createDecision: async (data) => {
    const res = await apiClient.post('/decisions', data);
    return res.data;
  },

  // Re-run AI analysis
  analyzeDecision: async (id) => {
    const res = await apiClient.post(`/decisions/${id}/analyze`);
    return res.data;
  },

  // Finalize human decision (Accept, Alternative, Override)
  finalizeDecision: async (id, payload) => {
    const res = await apiClient.post(`/decisions/${id}/finalize`, payload);
    return res.data;
  },

  // Run What-If simulation
  simulateWhatIf: async (id, payload) => {
    const res = await apiClient.post(`/decisions/${id}/simulate`, payload);
    return res.data;
  },

  // Seed demo supplier selection
  seedDemo: async () => {
    const res = await apiClient.post('/decisions/seed-demo');
    return res.data;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  },
};

export const chatAPI = {
  // Parse natural language → full decision analysis (saves to DB)
  analyzeFromChat: async (message) => {
    const res = await apiClient.post('/chat/analyze', { message }, { timeout: 60000 });
    return res.data;
  },

  // Conversational follow-up Q&A about an existing decision
  sendMessage: async (message, decisionId = null, history = []) => {
    const res = await apiClient.post('/chat/message', { message, decisionId, history }, { timeout: 30000 });
    return res.data;
  },

  // Quick lightweight analysis (no DB save)
  quickAnalyze: async (message) => {
    const res = await apiClient.post('/chat/quick', { message }, { timeout: 30000 });
    return res.data;
  },
};

export default apiClient;
