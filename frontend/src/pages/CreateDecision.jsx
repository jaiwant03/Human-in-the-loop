import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Sliders, Layers, ArrowRight, ArrowLeft,
  PlusCircle, Trash2, CheckCircle2, AlertCircle,
  Bot, UserCheck, Edit3, Info, ChevronRight,
  Sparkles, RefreshCw, Lock, Eye, AlertTriangle,
  Loader2, Check, X
} from 'lucide-react';
import { decisionAPI, aiAPI } from '../services/api';

// ── Colour tokens for badge states ────────────────────────────
const STATE = {
  ai:       { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', label: 'AI Suggested' },
  reviewed: { bg: '#FFFBEB', border: '#FCD34D', text: '#D97706', label: 'Needs Review' },
  edited:   { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', label: 'Human Edited' },
  approved: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', label: 'Human Approved' },
  manual:   { bg: '#F8FAFC', border: '#CBD5E1', text: '#475569', label: 'Manually Added' },
  calculated: { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF', label: 'System Calculated' },
  adjusted: { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', label: 'Human Adjusted' },
};

function SourceBadge({ source }) {
  const s = STATE[source] || STATE.manual;
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem',
      borderRadius: '999px', background: s.bg, border: `1px solid ${s.border}`,
      color: s.text, textTransform: 'uppercase', letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {source === 'ai_suggested' || source === 'ai' ? <><Bot size={9} style={{ marginRight: 2 }} />AI Suggested</> : s.label}
    </span>
  );
}

// ── Steps definition ─────────────────────────────────────────
const STEP_DEFS = [
  { n: 1, label: 'Decision Context' },
  { n: 2, label: 'Criteria & Weights' },
  { n: 3, label: 'Options & Evidence' },
];

const CATEGORIES = [
  'Custom', 'Supplier Selection', 'Vendor Selection', 'Project Selection',
  'Product Selection', 'Investment Selection', 'Resource Allocation',
  'Career Decision', 'Event Selection',
];

// ────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────
export default function CreateDecision() {
  const navigate = useNavigate();

  // ── Global state ─────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Decision Context ─────────────────────────────────
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Custom');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');

  // ── Step 2: Criteria state ───────────────────────────────────
  const [criteria, setCriteria] = useState([]);
  const [fetchingCriteria, setFetchingCriteria] = useState(false);
  const [criteriaFetched, setCriteriaFetched] = useState(false);
  const [criteriaNote, setCriteriaNote] = useState('');
  const [editingCritIdx, setEditingCritIdx] = useState(null);

  // ── Step 3: Options state ────────────────────────────────────
  const [options, setOptions] = useState([]);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [optionsFetched, setOptionsFetched] = useState(false);
  const [optionsNote, setOptionsNote] = useState('');
  const [editingOptIdx, setEditingOptIdx] = useState(null);

  // ──────────────────────────────────────────────────────────────
  // STEP 1 HELPERS
  // ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!title.trim()) { setError('Decision title is required.'); return false; }
    if (!description.trim()) { setError('Problem statement is required.'); return false; }
    setError(''); return true;
  };

  const handleStep1Continue = async () => {
    if (!validateStep1()) return;
    setFetchingCriteria(true);
    setError('');
    setCriteriaFetched(false);
    setCriteria([]);

    try {
      const res = await aiAPI.suggestCriteria({ title, description, category, constraints, successCriteria });
      if (res.success && Array.isArray(res.criteria)) {
        setCriteria(res.criteria.map(c => ({ ...c, approved: false, editMode: false })));
        setCriteriaNote(res.note || '');
        setCriteriaFetched(true);
        setStep(2);
      } else {
        setError(res.message || 'Could not fetch criteria suggestions.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Backend error. Make sure the server is running.');
    } finally {
      setFetchingCriteria(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // STEP 2 HELPERS
  // ──────────────────────────────────────────────────────────────
  const totalWeight = criteria.reduce((s, c) => s + (parseFloat(c.suggestedWeight) || 0), 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.5;
  const allCritApproved = criteria.length >= 2 && criteria.every(c => c.approved);

  const updateCrit = (idx, field, value) => {
    setCriteria(prev => prev.map((c, i) => {
      if (i !== idx) return c;
      const updated = { ...c, [field]: value };
      if (field !== 'approved') updated.source = c.source === 'ai_suggested' ? 'edited' : c.source;
      return updated;
    }));
  };

  const approveCrit = (idx) => {
    setCriteria(prev => prev.map((c, i) =>
      i === idx ? { ...c, approved: true, editMode: false } : c
    ));
  };

  const unapprove = (idx) => {
    setCriteria(prev => prev.map((c, i) =>
      i === idx ? { ...c, approved: false } : c
    ));
  };

  const removeCrit = (idx) => {
    if (criteria.length <= 2) { setError('Minimum 2 criteria required.'); return; }
    if (!window.confirm(`Remove "${criteria[idx].name}"?`)) return;
    const key = criteria[idx].key;
    setCriteria(prev => prev.filter((_, i) => i !== idx));
    setOptions(prev => prev.map(o => { const c = { ...o.criteria }; delete c[key]; return { ...o, criteria: c }; }));
  };

  const addManualCrit = () => {
    const key = `crit_${Date.now()}`;
    setCriteria(prev => [...prev, {
      key, name: '', description: '', suggestedWeight: 10,
      source: 'manual', approved: false, editMode: true,
    }]);
    setOptions(prev => prev.map(o => ({ ...o, criteria: { ...o.criteria, [key]: '' } })));
  };

  const rebalanceWeights = () => {
    if (criteria.length === 0) return;
    const equal = Math.floor(100 / criteria.length);
    const remainder = 100 - equal * criteria.length;
    setCriteria(prev => prev.map((c, i) => ({
      ...c, suggestedWeight: i === prev.length - 1 ? equal + remainder : equal,
      source: c.source === 'ai_suggested' ? 'edited' : c.source,
    })));
  };

  const validateStep2 = () => {
    if (criteria.length < 2) { setError('Add at least 2 criteria.'); return false; }
    const noName = criteria.find(c => !c.name.trim());
    if (noName) { setError('All criteria must have a name.'); return false; }
    if (!weightOk) { setError(`Weights must total 100%. Current: ${Math.round(totalWeight)}%`); return false; }
    if (!allCritApproved) { setError('Approve all criteria before continuing.'); return false; }
    setError(''); return true;
  };

  const handleStep2Continue = async () => {
    if (!validateStep2()) return;
    setFetchingOptions(true);
    setError('');
    setOptionsFetched(false);
    setOptions([]);

    try {
      const res = await aiAPI.suggestOptions({ title, description, category, constraints, criteria });
      if (res.success) {
        if (Array.isArray(res.options) && res.options.length > 0) {
          // Ensure scores exist for all approved criteria
          setOptions(res.options.map(opt => {
            const filled = { ...opt.criteria };
            criteria.forEach(c => {
              if (!(c.key in filled)) filled[c.key] = '';
            });
            return { ...opt, criteria: filled, approved: false, editMode: false };
          }));
          setOptionsNote(res.note || '');
        } else {
          // AI returned nothing — start with two blank options
          setOptions(makeBlankOptions(2));
          setOptionsNote(res.note || 'No AI suggestions available. Add options manually.');
        }
        setOptionsFetched(true);
        setStep(3);
      } else {
        setError(res.message || 'Could not fetch option suggestions.');
      }
    } catch (e) {
      // On error, still go to step 3 with blank options
      setOptions(makeBlankOptions(2));
      setOptionsNote('AI unavailable. Add options manually.');
      setOptionsFetched(true);
      setStep(3);
    } finally {
      setFetchingOptions(false);
    }
  };

  const makeBlankOptions = (count) => Array.from({ length: count }, (_, i) => {
    const crit = {};
    criteria.forEach(c => { crit[c.key] = ''; });
    return { id: `opt-${Date.now()}-${i}`, name: '', description: '', criteria: crit, source: 'manual', approved: false, editMode: true };
  });

  // ──────────────────────────────────────────────────────────────
  // STEP 3 HELPERS
  // ──────────────────────────────────────────────────────────────
  const allOptsApproved = options.length >= 2 && options.every(o => o.approved);

  const updateOptField = (idx, field, value) => {
    setOptions(prev => prev.map((o, i) => {
      if (i !== idx) return o;
      const updated = { ...o, [field]: value };
      if (field !== 'approved') updated.source = o.source === 'ai_suggested' ? 'edited' : o.source;
      return updated;
    }));
  };

  const updateScore = (optIdx, critKey, value) => {
    setOptions(prev => prev.map((o, i) => {
      if (i !== optIdx) return o;
      const raw = value === '' ? '' : Math.min(100, Math.max(0, parseFloat(value) || 0));
      const prevMeta = o.scoreMetadata || {};
      const prevEntry = prevMeta[critKey] || {};
      const wasAI = prevEntry.source === 'ai_estimated';
      return {
        ...o,
        criteria: { ...o.criteria, [critKey]: raw },
        scoreMetadata: {
          ...prevMeta,
          [critKey]: {
            ...prevEntry,
            value: raw,
            source: wasAI ? 'human_adjusted' : (prevEntry.source || 'manual'),
            humanAdjusted: wasAI ? true : prevEntry.humanAdjusted,
          },
        },
      };
    }));
  };

  const approveOpt = (idx) => {
    setOptions(prev => prev.map((o, i) =>
      i === idx ? { ...o, approved: true, editMode: false } : o
    ));
  };

  const unapproveOpt = (idx) => {
    setOptions(prev => prev.map((o, i) =>
      i === idx ? { ...o, approved: false } : o
    ));
  };

  const removeOpt = (idx) => {
    if (options.length <= 2) { setError('Minimum 2 options required.'); return; }
    if (!window.confirm(`Remove "${options[idx].name}"?`)) return;
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const addManualOpt = () => {
    if (options.length >= 10) { setError('Maximum 10 options.'); return; }
    const crit = {};
    criteria.forEach(c => { crit[c.key] = ''; });
    setOptions(prev => [...prev, {
      id: `opt-${Date.now()}`, name: '', description: '',
      criteria: crit, scoreMetadata: {}, source: 'manual', approved: false, editMode: true,
    }]);
  };

  const validateStep3 = () => {
    if (options.length < 2) { setError('Add at least 2 options.'); return false; }
    const noName = options.find(o => !o.name.trim());
    if (noName) { setError('All options must have a name.'); return false; }
    for (const opt of options) {
      for (const c of criteria) {
        const v = opt.criteria[c.key];
        if (v === '' || v === null || v === undefined || isNaN(parseFloat(v))) {
          setError(`Enter a score for "${opt.name || 'unnamed option'}" on "${c.name}".`);
          return false;
        }
      }
    }
    if (!allOptsApproved) { setError('Approve all options before analyzing.'); return false; }
    setError(''); return true;
  };

  // ──────────────────────────────────────────────────────────────
  // FINAL SUBMIT
  // ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep3()) return;

    const weights = {};
    criteria.forEach(c => { weights[c.key] = c.suggestedWeight; });

    const cleanOptions = options.map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      name: opt.name.trim(),
      description: opt.description || '',
      criteria: Object.fromEntries(
        criteria.map(c => [c.key, parseFloat(opt.criteria[c.key]) || 0])
      ),
    }));

    const cleanCriteria = criteria.map(c => ({
      key: c.key,
      name: c.name.trim(),
      weight: c.suggestedWeight,
      description: c.description || '',
    }));

    try {
      setSubmitting(true);
      const res = await decisionAPI.createDecision({
        title: title.trim(),
        description: description.trim(),
        category,
        criteria: cleanCriteria,
        weights,
        options: cleanOptions,
      });
      if (res.success && res.data?._id) {
        navigate(`/decisions/${res.data._id}`);
      } else {
        setError(res.message || 'Failed to create decision.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Server error. Is the backend running on port 5000?');
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ──────────────────────────────────────────────────────────────
  const Stepper = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {STEP_DEFS.map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.45rem 1rem', borderRadius: '999px',
            background: step === s.n ? 'var(--primary-very-light)' : step > s.n ? '#F0FDF4' : '#F8FAFC',
            border: `1px solid ${step === s.n ? 'var(--primary)' : step > s.n ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
          }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: step > s.n ? '#16A34A' : step === s.n ? '#166534' : '#CBD5E1',
              color: '#fff', fontSize: '0.7rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {step > s.n ? <Check size={11} /> : s.n}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step === s.n ? '#166534' : '#64748B', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < STEP_DEFS.length - 1 && <ChevronRight size={13} color="#CBD5E1" style={{ flexShrink: 0 }} />}
        </React.Fragment>
      ))}
    </div>
  );

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.3rem' }}>Create New Decision</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          AI assists with structure — you review, adjust and make the final call.
        </p>
      </div>

      <Stepper />

      {error && (
        <div className="alert-banner alert-warning" style={{ marginBottom: 0 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 1 — DECISION CONTEXT
      ══════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="hitl-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <FileText size={20} color="#16A34A" />
            <h3 style={{ fontSize: '1.1rem' }}>Step 1 — Decision Context</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Describe the decision and let AI help structure the evaluation criteria.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Decision Title <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Choose the best cloud provider for my startup" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problem Statement / Context <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea className="form-textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="We need a cloud provider for a new SaaS product. We need good performance, scalability, security and reasonable cost." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Constraints <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(optional)</span></label>
              <textarea className="form-textarea" rows={2} value={constraints} onChange={e => setConstraints(e.target.value)}
                placeholder="e.g. Budget below ₹1,00,000/month. Must support GDPR." />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Success Criteria <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(optional)</span></label>
              <textarea className="form-textarea" rows={2} value={successCriteria} onChange={e => setSuccessCriteria(e.target.value)}
                placeholder="e.g. Reliable infrastructure with 99.9% uptime, good developer tools." />
            </div>
          </div>

          {/* What happens next */}
          <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#1E40AF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Bot size={14} /> What happens next
            </div>
            AI will suggest evaluation criteria based on your context. You review, edit and approve them — nothing is used without your sign-off.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleStep1Continue} disabled={fetchingCriteria}
              style={{ minWidth: '240px' }}>
              {fetchingCriteria
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Getting AI Criteria Suggestions…</>
                : <>Continue &amp; Get AI Suggestions <ArrowRight size={16} /></>
              }
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 2 — CRITERIA & WEIGHTS (Human Review)
      ══════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* AI suggestion note */}
          {criteriaNote && (
            <div style={{ padding: '0.85rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#1E40AF', display: 'flex', gap: '0.6rem' }}>
              <Bot size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <div><strong>AI Note:</strong> {criteriaNote}</div>
            </div>
          )}

          <div className="hitl-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sliders size={20} color="#16A34A" />
                <h3 style={{ fontSize: '1.1rem' }}>Step 2 — Review Criteria &amp; Weights</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${weightOk ? 'badge-success' : 'badge-danger'}`}
                  style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}>
                  {Math.round(totalWeight)}% / 100%
                </span>
                {!allCritApproved && (
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                    Human Review Required
                  </span>
                )}
                {allCritApproved && weightOk && (
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                    <Check size={10} /> All Approved
                  </span>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              AI has suggested these criteria based on your decision context.
              Review each one — edit the name, description or weight, then click <strong>Approve</strong>.
              All criteria must be approved before you can continue.
            </p>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1.6fr auto', gap: '0.6rem', padding: '0 0.5rem', marginBottom: '0.4rem' }}>
              {['Criterion & Source', 'Weight %', 'Description', ''].map((h, i) => (
                <span key={i} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {criteria.map((c, idx) => (
                <CriterionRow
                  key={c.key}
                  c={c} idx={idx}
                  isEditing={editingCritIdx === idx}
                  onEdit={() => setEditingCritIdx(editingCritIdx === idx ? null : idx)}
                  onUpdate={(field, val) => updateCrit(idx, field, val)}
                  onApprove={() => { approveCrit(idx); setEditingCritIdx(null); }}
                  onUnapprove={() => unapprove(idx)}
                  onRemove={() => removeCrit(idx)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={addManualCrit} className="btn btn-sm btn-outline-primary">
                  <PlusCircle size={13} /> Add Criterion
                </button>
                <button onClick={rebalanceWeights} className="btn btn-sm btn-secondary" title="Distribute weights equally">
                  <RefreshCw size={13} /> Equal Weights
                </button>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Info size={12} color="#3B82F6" />
                {criteria.filter(c => c.approved).length}/{criteria.length} approved
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={15} /> Back
            </button>
            <button className="btn btn-primary" onClick={handleStep2Continue}
              disabled={fetchingOptions}
              style={{ minWidth: '260px' }}>
              {fetchingOptions
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Getting Option Suggestions…</>
                : <><UserCheck size={15} /> Approve Criteria &amp; Get Option Suggestions <ArrowRight size={15} /></>
              }
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 3 — OPTIONS & EVIDENCE (Human Review)
      ══════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {optionsNote && (
            <div style={{ padding: '0.85rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#1E40AF', display: 'flex', gap: '0.6rem' }}>
              <Bot size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <div><strong>AI Note:</strong> {optionsNote}</div>
            </div>
          )}

          <div className="hitl-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={20} color="#16A34A" />
                <h3 style={{ fontSize: '1.1rem' }}>Step 3 — Options &amp; Evidence</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!allOptsApproved && (
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Human Review Required</span>
                )}
                {allOptsApproved && (
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                    <Check size={10} /> All Approved
                  </span>
                )}
                <button onClick={addManualOpt} className="btn btn-sm btn-outline-primary">
                  <PlusCircle size={13} /> Add Option
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              AI has suggested options and estimated scores. Scores labelled <SourceBadge source="calculated" /> are AI estimates.
              Verify and adjust each score, then approve the option.
              <strong style={{ color: '#DC2626' }}> You must approve all options before calculating results.</strong>
            </p>

            {/* Score legend */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem' }}>Score labels:</span>
              <SourceBadge source="calculated" />
              <SourceBadge source="adjusted" />
              <SourceBadge source="manual" />
              <SourceBadge source="ai_suggested" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {options.map((opt, oi) => (
                <OptionCard
                  key={opt.id}
                  opt={opt} oi={oi}
                  criteria={criteria}
                  isEditing={editingOptIdx === oi}
                  onEdit={() => setEditingOptIdx(editingOptIdx === oi ? null : oi)}
                  onUpdateField={(field, val) => updateOptField(oi, field, val)}
                  onUpdateScore={(key, val) => updateScore(oi, key, val)}
                  onApprove={() => { approveOpt(oi); setEditingOptIdx(null); }}
                  onUnapprove={() => unapproveOpt(oi)}
                  onRemove={() => removeOpt(oi)}
                />
              ))}
            </div>
          </div>

          {/* Scoring info */}
          <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <Info size={14} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Deterministic Scoring:</strong>{' '}
              Final scores = Σ(criterion score × criterion weight). The AI explains results — it does not calculate them.
              Approved human scores are used as-is; no AI override is possible after you confirm.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={15} /> Back
            </button>
            <button className="btn btn-lg btn-primary" onClick={handleSubmit}
              disabled={submitting} style={{ minWidth: '270px' }}>
              {submitting
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Calculating &amp; Analyzing…</>
                : <><Lock size={15} /> Confirm &amp; Analyze Decision <ArrowRight size={16} /></>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CRITERION ROW component
// ──────────────────────────────────────────────────────────────
function CriterionRow({ c, idx, isEditing, onEdit, onUpdate, onApprove, onUnapprove, onRemove }) {
  const sourceBadge = c.approved ? 'approved' : c.source === 'ai_suggested' ? 'ai_suggested' : c.source === 'edited' ? 'edited' : 'manual';

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${c.approved ? '#BBF7D0' : c.source === 'ai_suggested' ? '#BFDBFE' : 'var(--border-subtle)'}`,
      background: c.approved ? '#F0FDF4' : c.source === 'ai_suggested' ? '#EFF6FF' : '#F8FAFC',
      overflow: 'hidden',
    }}>
      {/* Row: name + weight + desc + actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1.6fr auto', gap: '0.6rem', alignItems: 'center', padding: '0.75rem 0.85rem' }}>
        {/* Name + badge */}
        <div>
          {isEditing ? (
            <input className="form-input" value={c.name} placeholder="Criterion name"
              onChange={e => onUpdate('name', e.target.value)} autoFocus />
          ) : (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {c.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>unnamed</span>}
              </div>
              <SourceBadge source={sourceBadge === 'ai_suggested' ? 'ai' : sourceBadge} />
            </div>
          )}
        </div>

        {/* Weight */}
        <div style={{ position: 'relative' }}>
          <input type="number" min={0} max={100} className="form-input"
            style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
            value={c.suggestedWeight} disabled={c.approved && !isEditing}
            onChange={e => onUpdate('suggestedWeight', parseFloat(e.target.value) || 0)} />
          {!isEditing && <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>%</span>}
        </div>

        {/* Description */}
        {isEditing ? (
          <input className="form-input" value={c.description} placeholder="What does this measure?"
            onChange={e => onUpdate('description', e.target.value)} />
        ) : (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {c.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>no description</span>}
          </span>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {!c.approved && (
            <>
              <button onClick={onEdit}
                style={{ padding: '0.3rem', border: '1px solid var(--border-light)', borderRadius: '6px', background: isEditing ? 'var(--primary-very-light)' : 'transparent', cursor: 'pointer', color: '#475569' }}
                title={isEditing ? 'Done editing' : 'Edit'}>
                <Edit3 size={13} />
              </button>
              <button onClick={onApprove}
                style={{ padding: '0.3rem 0.6rem', border: '1px solid #BBF7D0', borderRadius: '6px', background: '#F0FDF4', cursor: 'pointer', color: '#166534', fontSize: '0.72rem', fontWeight: 700 }}
                title="Approve this criterion">
                <Check size={12} /> Approve
              </button>
              <button onClick={onRemove}
                style={{ padding: '0.3rem', border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}
                title="Remove">
                <X size={13} />
              </button>
            </>
          )}
          {c.approved && (
            <>
              <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Approved
              </span>
              <button onClick={onUnapprove}
                style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#64748B', fontSize: '0.7rem' }}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI rationale (collapsed when approved) */}
      {!c.approved && c.rationale && (
        <div style={{ padding: '0.4rem 0.85rem 0.6rem', borderTop: '1px solid rgba(59,130,246,0.12)', fontSize: '0.76rem', color: '#3B82F6', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
          <Bot size={11} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>AI rationale:</strong> {c.rationale}</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// OPTION CARD component
// ──────────────────────────────────────────────────────────────
function OptionCard({ opt, oi, criteria, isEditing, onEdit, onUpdateField, onUpdateScore, onApprove, onUnapprove, onRemove }) {
  const sourceBadge = opt.approved ? 'approved' : opt.source === 'ai_suggested' ? 'ai' : opt.source === 'edited' ? 'edited' : 'manual';

  return (
    <div style={{
      border: `2px solid ${opt.approved ? '#BBF7D0' : opt.source === 'ai_suggested' ? '#BFDBFE' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-md)',
      background: opt.approved ? '#F0FDF4' : '#fff',
      overflow: 'hidden',
    }}>
      {/* Option header */}
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', background: opt.approved ? '#F0FDF4' : 'var(--bg-secondary)' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            {isEditing ? (
              <input className="form-input" value={opt.name} placeholder={`Option ${oi + 1} name`}
                onChange={e => onUpdateField('name', e.target.value)} autoFocus
                style={{ fontWeight: 700, fontSize: '1rem' }} />
            ) : (
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {opt.name || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>unnamed option</span>}
              </span>
            )}
            <SourceBadge source={sourceBadge} />
          </div>
          {isEditing ? (
            <input className="form-input" value={opt.description} placeholder="Brief description"
              onChange={e => onUpdateField('description', e.target.value)}
              style={{ fontSize: '0.85rem' }} />
          ) : (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{opt.description}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {!opt.approved && (
            <>
              <button onClick={onEdit}
                style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border-light)', borderRadius: '6px', background: isEditing ? 'var(--primary-very-light)' : 'transparent', cursor: 'pointer', color: '#475569', fontSize: '0.75rem' }}>
                <Edit3 size={12} /> {isEditing ? 'Done' : 'Edit'}
              </button>
              <button onClick={onApprove}
                style={{ padding: '0.3rem 0.7rem', border: '1px solid #BBF7D0', borderRadius: '6px', background: '#F0FDF4', cursor: 'pointer', color: '#166534', fontSize: '0.75rem', fontWeight: 700 }}>
                <Check size={12} /> Approve Option
              </button>
              <button onClick={onRemove}
                style={{ padding: '0.3rem', border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}>
                <X size={13} />
              </button>
            </>
          )}
          {opt.approved && (
            <>
              <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Approved
              </span>
              <button onClick={onUnapprove}
                style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#64748B', fontSize: '0.7rem' }}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scores per criterion */}
      <div style={{ padding: '0.85rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {criteria.map(c => {
          const meta = opt.scoreMetadata?.[c.key] || {};
          const scoreVal = opt.criteria[c.key];
          const isAiEstimate = meta.source === 'ai_estimated';
          const isHumanAdj = meta.source === 'human_adjusted';
          const badgeLabel = isHumanAdj ? 'adjusted' : isAiEstimate ? 'calculated' : 'manual';

          return (
            <div key={c.key} style={{
              padding: '0.65rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${isHumanAdj ? '#FCD34D' : isAiEstimate ? '#93C5FD' : 'var(--border-subtle)'}`,
              background: isHumanAdj ? '#FFFBEB' : isAiEstimate ? '#EFF6FF' : '#F8FAFC',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748B' }}>{c.suggestedWeight}%</span>
              </div>
              <input
                type="number" min={0} max={100}
                className="form-input"
                style={{
                  textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '1rem', padding: '0.3rem 0.5rem',
                  background: isHumanAdj ? '#FFFBEB' : '#fff',
                  borderColor: isHumanAdj ? '#FCD34D' : isAiEstimate ? '#93C5FD' : 'var(--border-light)',
                }}
                value={scoreVal ?? ''}
                placeholder="0–100"
                onChange={e => onUpdateScore(c.key, e.target.value)}
                disabled={opt.approved}
              />
              <div style={{ marginTop: '0.25rem' }}>
                <SourceBadge source={badgeLabel} />
              </div>
              {meta.rationale && !isHumanAdj && (
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {meta.rationale}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
