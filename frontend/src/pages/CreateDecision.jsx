import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Trash2, ArrowRight,
  AlertCircle, CheckCircle2, Layers, Sliders,
  FileText, Info, ChevronRight
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function CreateDecision() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [criteria, setCriteria] = useState([
    { key: 'criterion_1', name: '', weight: 50, description: '' },
    { key: 'criterion_2', name: '', weight: 50, description: '' },
  ]);
  const [options, setOptions] = useState([
    { id: 'opt-1', name: '', description: '', criteria: { criterion_1: '', criterion_2: '' } },
    { id: 'opt-2', name: '', description: '', criteria: { criterion_1: '', criterion_2: '' } },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalWeight = criteria.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.01;

  /* ── Criteria helpers ── */
  const addCriterion = () => {
    const key = `crit_${Date.now()}`;
    setCriteria([...criteria, { key, name: '', weight: 0, description: '' }]);
    setOptions(options.map(o => ({ ...o, criteria: { ...o.criteria, [key]: '' } })));
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
    criteria.forEach(c => { scores[c.key] = ''; });
    setOptions([...options, { id, name: '', description: '', criteria: scores }]);
  };

  const removeOption = (idx) => {
    if (options.length <= 2) { setErrorMsg('Minimum 2 options required.'); return; }
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOptionName = (idx, name) => {
    const u = [...options]; u[idx].name = name; setOptions(u);
  };

  const updateScore = (optIdx, key, val) => {
    const raw = val === '' ? '' : Math.min(100, Math.max(0, parseFloat(val) || 0));
    const u = [...options]; u[optIdx].criteria[key] = raw; setOptions(u);
  };

  /* ── Validation helpers ── */
  const validateStep1 = () => {
    if (!title.trim()) { setErrorMsg('Decision title is required.'); return false; }
    if (!description.trim()) { setErrorMsg('Description is required.'); return false; }
    setErrorMsg(''); return true;
  };

  const validateStep2 = () => {
    const emptyName = criteria.find(c => !c.name.trim());
    if (emptyName) { setErrorMsg('All criteria must have a name.'); return false; }
    if (!weightOk) { setErrorMsg(`Weights must total 100%. Current: ${Math.round(totalWeight)}%`); return false; }
    setErrorMsg(''); return true;
  };

  const validateStep3 = () => {
    const emptyOpt = options.find(o => !o.name.trim());
    if (emptyOpt) { setErrorMsg('All options must have a name.'); return false; }
    for (const opt of options) {
      for (const c of criteria) {
        const v = opt.criteria[c.key];
        if (v === '' || v === null || v === undefined || isNaN(parseFloat(v))) {
          setErrorMsg(`Enter a score for "${opt.name}" on criterion "${c.name}".`);
          return false;
        }
      }
    }
    setErrorMsg(''); return true;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validateStep3()) return;

    const weights = {};
    criteria.forEach(c => { weights[c.key] = c.weight; });

    const cleanOptions = options.map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      name: opt.name.trim(),
      description: opt.description || '',
      criteria: Object.fromEntries(
        criteria.map(c => [c.key, parseFloat(opt.criteria[c.key]) || 0])
      ),
    }));

    try {
      setSubmitting(true);
      const res = await decisionAPI.createDecision({
        title: title.trim(),
        description: description.trim(),
        category,
        criteria: criteria.map(c => ({ ...c, name: c.name.trim() })),
        weights,
        options: cleanOptions,
      });
      if (res.success && res.data?._id) navigate(`/decisions/${res.data._id}`);
      else setErrorMsg(res.message || 'Failed to create decision.');
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Server error. Is the backend running on port 5000?');
    } finally { setSubmitting(false); }
  };

  const STEPS = [
    { n: 1, label: 'Decision Info' },
    { n: 2, label: 'Criteria & Weights' },
    { n: 3, label: 'Options & Scores' },
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.3rem' }}>Create New Decision</h1>
        <p style={{ fontSize: '0.9rem' }}>Define your options, criteria and weights — the system scores them and runs AI analysis.</p>
      </div>

      {/* Progress stepper — display only, not clickable (validates each step) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
              background: step === s.n ? 'var(--primary-very-light)' : step > s.n ? '#F0FDF4' : '#F8FAFC',
              border: `1px solid ${step === s.n ? 'var(--primary)' : step > s.n ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
            }}>
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
                placeholder="e.g. Select the Best Cloud Provider" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {[
                  'Custom', 'Supplier Selection', 'Vendor Selection', 'Project Selection',
                  'Product Selection', 'Investment Selection', 'Resource Allocation',
                  'Career Decision', 'Event Selection',
                ].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Problem Statement / Context *</label>
            <textarea className="form-textarea" rows={3} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the decision context, constraints, and what success looks like…" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary"
              onClick={() => { if (validateStep1()) setStep(2); }}>
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
            <span className={`badge ${weightOk ? 'badge-success' : 'badge-danger'}`}
              style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
              {weightOk ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              &nbsp;{Math.round(totalWeight)}% / 100%
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Define what you're evaluating each option on and how much each dimension matters.
            Weights must add up to exactly 100%.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1.5fr 36px', gap: '0.6rem', padding: '0 0.25rem', marginBottom: '0.5rem' }}>
            {['Criterion Name', 'Weight %', 'What it measures', ''].map((h, i) => (
              <span key={i} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {criteria.map((c, idx) => (
              <div key={c.key} style={{
                display: 'grid', gridTemplateColumns: '1fr 90px 1.5fr 36px', gap: '0.6rem', alignItems: 'center',
                padding: '0.75rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              }}>
                <input className="form-input" value={c.name} placeholder="e.g. Cost"
                  onChange={e => updateCriterion(idx, 'name', e.target.value)} />
                <div style={{ position: 'relative' }}>
                  <input type="number" min={0} max={100} className="form-input" value={c.weight}
                    onChange={e => updateCriterion(idx, 'weight', e.target.value)} />
                  <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>%</span>
                </div>
                <input className="form-input" value={c.description} placeholder="e.g. Total cost of ownership"
                  onChange={e => updateCriterion(idx, 'description', e.target.value)} />
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
              <button onClick={() => { if (validateStep2()) setStep(3); }} className="btn btn-primary">
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
                <h3 style={{ fontSize: '1.1rem' }}>Step 3 — Options & Scores (0–100)</h3>
              </div>
              <button onClick={addOption} className="btn btn-sm btn-outline-primary">
                <PlusCircle size={14} /> Add Option
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '0.7rem 0.85rem', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--border-subtle)', minWidth: '160px' }}>
                      Option Name
                    </th>
                    {criteria.map(c => (
                      <th key={c.key} style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border-subtle)', minWidth: '100px' }}>
                        <div style={{ color: '#0F172A', fontWeight: 700 }}>{c.name || '—'}</div>
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
                          value={opt.name} placeholder={`Option ${oi + 1}`}
                          onChange={e => updateOptionName(oi, e.target.value)} />
                      </td>
                      {criteria.map(c => (
                        <td key={c.key} style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                          <input type="number" min={0} max={100}
                            className="form-input"
                            style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0.45rem 0.4rem', fontSize: '0.9rem' }}
                            value={opt.criteria[c.key] ?? ''}
                            placeholder="0–100"
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
                Score each option 0–100 per criterion. Higher = better performance on that dimension.
                Scores are fed to the deterministic engine — the AI explains them, it does not invent them.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
            <button onClick={handleSubmit} disabled={submitting || !weightOk}
              className="btn btn-lg btn-primary" style={{ minWidth: '240px' }}>
              {submitting
                ? <><div className="spinner" /><span>Analyzing…</span></>
                : <><span>Analyze Decision with AI</span><ArrowRight size={17} /></>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
