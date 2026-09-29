import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateDecision from './pages/CreateDecision';
import DecisionAnalysis from './pages/DecisionAnalysis';
import DecisionHistory from './pages/DecisionHistory';
import DecisionDetails from './pages/DecisionDetails';
import WhatIfSimulator from './pages/WhatIfSimulator';
import DecisionChat from './pages/DecisionChat';

import './styles/global.css';
import './styles/dashboard.css';
import './styles/decision.css';

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            {/* Default → Chat (the "Decision Intelligence Copilot" screen) */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<DecisionChat />} />
            <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/create" element={<PageWrapper><CreateDecision /></PageWrapper>} />
            <Route path="/decisions/:id" element={<PageWrapper><DecisionAnalysis /></PageWrapper>} />
            <Route path="/decisions/:id/details" element={<PageWrapper><DecisionDetails /></PageWrapper>} />
            <Route path="/decisions/:id/simulate" element={<PageWrapper><WhatIfSimulator /></PageWrapper>} />
            <Route path="/history" element={<PageWrapper><DecisionHistory /></PageWrapper>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Wrapper that adds padding for pages that don't have their own topbar
function PageWrapper({ children }) {
  return (
    <div style={{ padding: '2rem 2.5rem 4rem', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
