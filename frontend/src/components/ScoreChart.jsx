import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ScoreChart({ calculatedScores = [], criteria = [], options = [] }) {
  if (!calculatedScores || calculatedScores.length === 0) {
    return null;
  }

  // 1. Data for Bar Chart (Option Comparison)
  const barLabels = calculatedScores.map(s => s.name);
  const barValues = calculatedScores.map(s => s.score);

  // Colors: Highlight rank #1 with bright gradient/accent
  const backgroundColors = calculatedScores.map((s, idx) =>
    idx === 0 ? 'rgba(99, 102, 241, 0.85)' : 'rgba(59, 130, 246, 0.45)'
  );
  const borderColors = calculatedScores.map((s, idx) =>
    idx === 0 ? '#818cf8' : '#60a5fa'
  );

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Overall Weighted Score',
        data: barValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => `Score: ${context.parsed.y} / 100`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#f8fafc', font: { weight: 'bold', family: 'Plus Jakarta Sans' } },
      },
    },
  };

  // 2. Data for Radar Chart (Criteria Breakdown)
  const radarLabels = criteria.map(c => c.name);
  const radarDatasets = options.slice(0, 3).map((opt, idx) => {
    const optCriteria = opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria || {};
    const values = criteria.map(c => optCriteria[c.key] || 0);

    const colors = [
      { bg: 'rgba(99, 102, 241, 0.25)', border: '#818cf8' },
      { bg: 'rgba(16, 185, 129, 0.2)', border: '#34d399' },
      { bg: 'rgba(245, 158, 11, 0.2)', border: '#fbbf24' },
    ];

    const currentTheme = colors[idx % colors.length];

    return {
      label: opt.name,
      data: values,
      backgroundColor: currentTheme.bg,
      borderColor: currentTheme.border,
      borderWidth: 2,
      pointBackgroundColor: currentTheme.border,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: currentTheme.border,
    };
  });

  const radarData = {
    labels: radarLabels,
    datasets: radarDatasets,
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          boxWidth: 14,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 20 },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: {
          color: '#cbd5e1',
          font: { size: 11, weight: '600', family: 'Plus Jakarta Sans' },
        },
      },
    },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {/* Option Score Bar Chart */}
      <div className="hitl-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart3 size={18} color="#6366f1" />
          <h3 style={{ fontSize: '1.05rem' }}>Option Score Comparison</h3>
        </div>
        <div style={{ height: '240px', position: 'relative' }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Criteria Breakdown Radar Chart */}
      <div className="hitl-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <RadarIcon size={18} color="#10b981" />
          <h3 style={{ fontSize: '1.05rem' }}>Criteria Multi-Axis Profiling</h3>
        </div>
        <div style={{ height: '240px', position: 'relative' }}>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
}
