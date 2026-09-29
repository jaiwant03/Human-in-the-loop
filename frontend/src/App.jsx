import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateDecision from './pages/CreateDecision';
import DecisionAnalysis from './pages/DecisionAnalysis';
import DecisionHistory from './pages/DecisionHistory';
import DecisionDetails from './pages/DecisionDetails';
import WhatIfSimulator from './pages/WhatIfSimulator';

import './styles/global.css';
import './styles/dashboard.css';
import './styles/decision.css';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateDecision />} />
            <Route path="/decisions/:id" element={<DecisionAnalysis />} />
            <Route path="/decisions/:id/details" element={<DecisionDetails />} />
            <Route path="/decisions/:id/simulate" element={<WhatIfSimulator />} />
            <Route path="/history" element={<DecisionHistory />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
