import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Trash2, Sparkles, ArrowRight,
  AlertCircle, CheckCircle2, Layers, Sliders,
  FileText, Info, ChevronRight
} from 'lucide-react';
import { decisionAPI } from '../services/api';

/* ── Presets ── */
const PRESETS = {
  supplier: {
    title: 'Select Best Supplier for Raw Materials',
    description: 'Strategic supplier selection for industrial manufacturing based on cost, quality, delivery, reliability and risk.',
    category: 'Supplier Selection',
    criteria: [
      { key: 'cost', name: 'Cost Efficiency', weight: 20, description: 'Bulk pricing and invoice terms' },
      { key: 'quality', name: 'Product Quality', weight: 30, description: 'Material grade and defect rate' },
      { key: 'delivery', name: 'Delivery Performance', weight: 20, description: 'On-time fulfillment and lead times' },
      { key: 'reliability', name: 'Operational Reliability', weight: 20, description: 'SLA history and financial stability' },
      { key: 'risk', name: 'Risk Management', weight: 10, description: 'Supply chain redundancy' },
    ],
    options: [
      { id: 'opt-1', name: 'Supplier A', description: 'Premium tier European manufacturer.', criteria: { cost: 78, quality: 92, delivery: 88, reliability: 91, risk: 85 } },
      { id: 'opt-2', name: 'Supplier B', description: 'Agile domestic logistics specialist.', criteria: { cost: 90, quality: 82, delivery: 94, reliability: 85, risk: 78 } },
      { id: 'opt-3', name: 'Supplier C', description: 'High-volume overseas partner.', criteria: { cost: 86, quality: 74, delivery: 80, reliability: 79, risk: 72 } },
    ],
  },
  laptop: {
    title: 'Choose the Best Laptop',
    description: 'Evaluate laptops based on price, performance, battery life and portability.',
    category: 'Product Selection',
    criteria: [
      { key: 'price', name: 'Price', weight: 30, description: 'Purchase cost and value for money' },
      { key: 'performance', name: 'Performance', weight: 30, description: 'CPU, RAM, GPU capability' },
      { key: 'battery', name: 'Battery Life', weight: 20, description: 'Hours on single charge' },
      { key: 'weight', name: 'Portability', weight: 20, description: 'Weight and form factor' },
    ],
    options: [
      { id: 'opt-1', name: 'Laptop A', description: 'High-performance workstation.', criteria: { price: 80, performance: 95, battery: 90, weight: 75 } },
      { id: 'opt-2', name: 'Laptop B', description: 'Balanced everyday laptop.', criteria: { price: 90, performance: 85, battery: 85, weight: 90 } },
      { id: 'opt-3', name: 'Laptop C', description: 'Budget-friendly option.', criteria: { price: 75, performance: 80, battery: 80, weight: 85 } },
    ],
  },
  project: {
    title: 'Q4 Engineering Initiative Selection',
    description: 'Prioritize engineering projects based on ROI, customer impact, speed and feasibility.',
    category: 'Project Selection',
    criteria: [
      { key: 'roi', name: 'Revenue / ROI', weight: 35, description: 'Projected 12-month financial return' },
      { key: 'impact', name: 'Customer Impact', weight: 25, description: 'NPS and retention influence' },
      { key: 'speed', name: 'Delivery Velocity', weight: 20, description: 'Time to market' },
      { key: 'risk', name: 'Feasibility / Risk', weight: 20, description: 'Technical readiness' },
    ],
    options: [
      { id: 'opt-1', name: 'Project Alpha (AI Copilot)', description: 'Customer-facing AI assistant.', criteria: { roi: 92, impact: 88, speed: 70, risk: 65 } },
      { id: 'opt-2', name: 'Project Beta (Cloud Migration)', description: 'Infrastructure modernisation.', criteria: { roi: 78, impact: 75, speed: 85, risk: 90 } },
      { id: 'opt-3', name: 'Project Gamma (Mobile Redesign)', description: 'iOS/Android UX revamp.', criteria: { roi: 82, impact: 91, speed: 80, risk: 82 } },
    ],
  },
};

export default function CreateDecision() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=info, 2=criteria, 3=options/matrix
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Supplier Selection');
  const [criteria, setCriteria] = useState([
    { key: 'cost', name: 'Cost Efficiency', weight: 20, description: '' },
    { key: 'quality', name: 'Product Quality', weight: 30, description: '' },
    { key: 'delivery', name: 'Delivery Performance', weight: 20, description: '' },
    { key: 'reliability', name: 'Operational Reliability', weight: 20, description: '' },
    { key: 'risk', name: 'Risk Management', weight: 10, description: '' },
  ]);
  const [options, setOptions] = useState([
    { id: 'opt-1', name: 'Option A', description: '', criteria: { cost: 80, quality: 85, delivery: 82, reliability: 88, risk: 78 } },
    { id: 'opt-2', name: 'Option B', description: '', criteria: { cost: 88, quality: 78, delivery: 90, reliability: 80, risk: 72 } },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalWeight = criteria.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.01;

  /* ── Preset loader ── */
  const loadPreset = (key) => {
    const p = PRESETS[key];
    if (!p) return;
    setTitle(p.title); setDescription(p.description); setCategory(p.category);
    setCriteria(JSON.parse(JSON.stringify(p.criteria)));
    setOptions(JSON.parse(JSON.stringify(p.options)));
    setErrorMsg('');
  };

  /* ── Criteria helpers ── */
  const addCriterion = () => {
    const key = `crit_${Date.now()}`;
    setCriteria([...criteria, { key, name: `Criterion ${criteria.length + 1}`, weight: 10, description: '' }]);
    setOptions(options.map(o => ({ ...o, criteria: { ...o.criteria, [key]: 75 } })));
  };

  const removeCriterion = (idx) => {
    if (criteria.length <= 2) { setErrorMsg('Minimum 2 criteria required.'); return; }
    const key = criteria[idx].key;
    setCriteria(criteria.filter((_, i) => i !== idx));
    setOptions(options.map(o => { const c = { ...o.criteria }; delete c[key]; return { ...o, criteria: c }; }));
  };

  const updateCriterion = (idx, field, value) => {
    const updated = [...criteria];
    updated[idx][field] = field === 'weight' ? parseFloat(value) || 0 : value;
    setCriteria(updated);
  };

  /* ── Option helpers ── */
  const addOption = () => {
    if (options.length >= 10) { setErrorMsg('Maximum 10 options.'); return; }
    const id = `opt-${Date.now()}`;
    const scores = {};
    criteria.forEach(c => { scores[c.key] = 75; });
    setOptions([...options, { id, name: `Option ${options.length + 1}`, description: '', criteria: scores }]);
  };

  const removeOption = (idx) => {
    if (options.length <= 2) { setErrorMsg('Minimum 2 options required.'); return; }
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOptionName = (idx, name) => {
    const u = [...options]; u[idx].name = name; setOptions(u);
  };

  const updateScore = (optIdx, key, val) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    const u = [...options]; u[optIdx].criteria[key] = num; setOptions(u);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setErrorMsg('');
    if (!title.trim()) { setErrorMsg('Decision title is required.'); return; }
    if (!description.trim()) { setErrorMsg('Description is required.'); return; }
    if (!weightOk) { setErrorMsg(`Criteria weights must sum to 100%. Current: ${totalWeight}%`); return; }

    const weights = {};
    criteria.forEach(c => { weights[c.key] = c.weight; });

    try {
      setSubmitting(true);
      const res = await decisionAPI.createDecision({ title, description, category, criteria, weights, options });
      if (res.success && res.data?._id) navigate(`/decisions/${res.data._id}`);
      else setErrorMsg(res.message || 'Failed to create decision.');
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Server error. Is the backend running?');
    } finally { setSubmitting(false); }
  };

  /* ── Stepper indicator ── */
  const STEPS = [
    { n: 1, label: 'Decision Info' },
    { n: 2, label: 'Criteria & Weights' },
    { n: 3, label: 'Options & Scores' },
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.3rem' }}>Create Decision Model</h1>
          <p style={{ fontSize: '0.9rem' }}>Define options, criteria and weights — then let AI explain the results.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Load template:</span>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} onClick={() => loadPreset(key)} className="btn btn-sm btn-secondary">
              <Sparkles size={13} color="#16A34A" /> {p.category.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div
              onClick={() => setStep(s.n)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                background: step === s.n ? 'var(--primary-very-light)' : step > s.n ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${step === s.n ? 'var(--primary)' : step > s.n ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: step > s.n ? '#16A34A' : step === s.n ? '#166534' : '#CBD5E1',
                color: '#fff', fontSize: '0.72rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step > s.n ? <CheckCircle2 size={13} /> : s.n}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step === s.n ? '#166534' : '#64748B' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} color="#CBD5E1" />}
          </React.Fragment>
        ))}
      </div>

      {errorMsg && (
        <div className="alert-banner alert-warning">
          <AlertCircle size={16} /><span>{errorMsg}</span>
        </div>
      )}

      {/* ── STEP 1: Decision Info ── */}
      {step === 1 && (
        <div className="hitl-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <FileText size={20} color="#16A34A" />
            <h3 style={{ fontSize: '1.1rem' }}>Step 1 — Decision Information</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Decision Title *</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Choose the Best Laptop" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {['Supplier Selection','Project Selection','Product Selection','Vendor Selection',
                  'Investment Selection','Resource Allocation','Career Decision','Event Selection','Custom'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Problem Statement / Context *</label>
            <textarea className="form-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the decision context, constraints, and objectives…" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary"
              onClick={() => { if (!title.trim() || !description.trim()) { setErrorMsg('Title and description are required.'); return; } setErrorMsg(''); setStep(2); }}>
              Next: Criteria & Weights <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Criteria & Weights ── */}
      {step === 2 && (
        <div className="hitl-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sliders size={20} color="#16A34A" />
              <h3 style={{ fontSize: '1.1rem' }}>Step 2 — Criteria & Weights</h3>
            </div>
            <span className={`badge ${weightOk ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
              {weightOk ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {totalWeight}% / 100%
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Each criterion defines an evaluation dimension. Weights must total exactly 100%.
          </p>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1.5fr 36px', gap: '0.6rem', padding: '0 0.25rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weight %</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</span>
            <span />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {criteria.map((c, idx) => (
              <div key={c.key} style={{
                display: 'grid', gridTemplateColumns: '1fr 90px 1.5fr 36px', gap: '0.6rem', alignItems: 'center',
                padding: '0.75rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              }}>
                <input className="form-input" value={c.name}
                  onChange={e => updateCriterion(idx, 'name', e.target.value)} placeholder="Criterion name" />
                <div style={{ position: 'relative' }}>
                  <input type="number" min={0} max={100} className="form-input" value={c.weight}
                    onChange={e => updateCriterion(idx, 'weight', e.target.value)} />
                  <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>%</span>
                </div>
                <input className="form-input" value={c.description}
                  onChange={e => updateCriterion(idx, 'description', e.target.value)} placeholder="What does this measure?" />
                <button onClick={() => removeCriterion(idx)} className="btn btn-sm"
                  style={{ padding: '0.35rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button onClick={addCriterion} className="btn btn-sm btn-outline-primary">
              <PlusCircle size={14} /> Add Criterion
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
              <button onClick={() => { if (!weightOk) { setErrorMsg(`Weights must total 100%. Current: ${totalWeight}%`); return; } setErrorMsg(''); setStep(3); }}
                className="btn btn-primary">
                Next: Options & Scores <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Options & Score Matrix ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="hitl-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={20} color="#16A34A" />
                <h3 style={{ fontSize: '1.1rem' }}>Step 3 — Candidate Options &amp; Scores (0–100)</h3>
              </div>
              <button onClick={addOption} className="btn btn-sm btn-outline-primary">
                <PlusCircle size={14} /> Add Option
              </button>
            </div>

            {/* Score Matrix Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '0.7rem 0.85rem', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--border-subtle)', minWidth: '140px' }}>
                      Option
                    </th>
                    {criteria.map(c => (
                      <th key={c.key} style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border-subtle)', minWidth: '100px' }}>
                        <div style={{ color: '#0F172A', fontWeight: 700 }}>{c.name}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.weight}%</div>
                      </th>
                    ))}
                    <th style={{ padding: '0.7rem 0.5rem', borderBottom: '2px solid var(--border-subtle)', width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {options.map((opt, oi) => (
                    <tr key={opt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        <input className="form-input" style={{ fontSize: '0.875rem', padding: '0.45rem 0.7rem' }}
                          value={opt.name} onChange={e => updateOptionName(oi, e.target.value)} />
                      </td>
                      {criteria.map(c => (
                        <td key={c.key} style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                          <input type="number" min={0} max={100}
                            className="form-input"
                            style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0.45rem 0.4rem', fontSize: '0.9rem' }}
                            value={opt.criteria[c.key] ?? 75}
                            onChange={e => updateScore(oi, c.key, e.target.value)} />
                        </td>
                      ))}
                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                        {options.length > 2 && (
                          <button onClick={() => removeOption(oi)} className="btn btn-sm"
                            style={{ padding: '0.35rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Info size={14} color="#3B82F6" />
                Enter scores from 0–100 for each criterion. Higher = better performance on that dimension. These scores are used by the deterministic engine — not invented by AI.
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
            <button onClick={handleSubmit} disabled={submitting || !weightOk} className="btn btn-lg btn-primary" style={{ minWidth: '240px' }}>
              {submitting ? (
                <><div className="spinner" /><span>Calculating &amp; Analyzing…</span></>
              ) : (
                <><span>Analyze Decision with AI</span><ArrowRight size={17} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
