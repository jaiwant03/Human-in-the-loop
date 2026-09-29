import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  FileText 
} from 'lucide-react';
import { decisionAPI } from '../services/api';

const PRESETS = {
  supplier: {
    title: 'Strategic Raw Material Supplier Selection',
    description: 'Procurement evaluation of Tier-1 manufacturing suppliers balancing premium quality standards with logistics velocity and unit pricing.',
    category: 'Supplier Selection',
    criteria: [
      { key: 'cost', name: 'Cost Efficiency', weight: 20, description: 'Bulk pricing discount and invoice terms' },
      { key: 'quality', name: 'Product Quality', weight: 30, description: 'Material grade and defect rate' },
      { key: 'delivery', name: 'Delivery Performance', weight: 20, description: 'On-time fulfillment rate and lead times' },
      { key: 'reliability', name: 'Operational Reliability', weight: 20, description: 'SLA history and financial backing' },
      { key: 'risk', name: 'Risk Management', weight: 10, description: 'Supply chain redundancy' },
    ],
    options: [
      {
        id: 'opt-1',
        name: 'Supplier A',
        description: 'Established European manufacturer with ISO 9001 certification.',
        criteria: { cost: 78, quality: 92, delivery: 88, reliability: 91, risk: 85 },
      },
      {
        id: 'opt-2',
        name: 'Supplier B',
        description: 'Agile domestic supplier with fast ground transport network.',
        criteria: { cost: 90, quality: 82, delivery: 94, reliability: 85, risk: 78 },
      },
      {
        id: 'opt-3',
        name: 'Supplier C',
        description: 'High-volume overseas partner with favorable unit pricing.',
        criteria: { cost: 86, quality: 74, delivery: 80, reliability: 79, risk: 72 },
      },
    ],
  },
  project: {
    title: 'Enterprise Q4 Tech Initiative Prioritization',
    description: 'Evaluating candidate engineering initiatives based on expected ROI, technical risk, delivery speed, and customer impact.',
    category: 'Project Selection',
    criteria: [
      { key: 'roi', name: 'Revenue / ROI', weight: 35, description: 'Projected financial return over 12 months' },
      { key: 'impact', name: 'Customer Impact', weight: 25, description: 'Net promoter score and retention influence' },
      { key: 'speed', name: 'Delivery Velocity', weight: 20, description: 'Time to market and sprint completion' },
      { key: 'risk', name: 'Feasibility / Low Risk', weight: 20, description: 'Technical stack readiness and compliance' },
    ],
    options: [
      {
        id: 'opt-1',
        name: 'Project Alpha (AI Copilot)',
        description: 'Customer-facing generative assistant for support automation.',
        criteria: { roi: 92, impact: 88, speed: 70, risk: 65 },
      },
      {
        id: 'opt-2',
        name: 'Project Beta (Cloud Migration)',
        description: 'Infrastructure modernization reducing latency and downtime.',
        criteria: { roi: 78, impact: 75, speed: 85, risk: 90 },
      },
      {
        id: 'opt-3',
        name: 'Project Gamma (Mobile App Redesign)',
        description: 'UI/UX revamp for iOS and Android store presence.',
        criteria: { roi: 82, impact: 91, speed: 80, risk: 82 },
      },
    ],
  },
};

export default function CreateDecision() {
  const navigate = useNavigate();

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
    {
      id: 'opt-1',
      name: 'Supplier A',
      description: '',
      criteria: { cost: 78, quality: 92, delivery: 88, reliability: 91, risk: 85 },
    },
    {
      id: 'opt-2',
      name: 'Supplier B',
      description: '',
      criteria: { cost: 90, quality: 82, delivery: 94, reliability: 85, risk: 78 },
    },
    {
      id: 'opt-3',
      name: 'Supplier C',
      description: '',
      criteria: { cost: 86, quality: 74, delivery: 80, reliability: 79, risk: 72 },
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate sum of weights
  const totalWeight = criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1;

  // Load Preset
  const handleLoadPreset = (key) => {
    const p = PRESETS[key];
    if (!p) return;
    setTitle(p.title);
    setDescription(p.description);
    setCategory(p.category);
    setCriteria(JSON.parse(JSON.stringify(p.criteria)));
    setOptions(JSON.parse(JSON.stringify(p.options)));
    setErrorMsg('');
  };

  // Add Criterion
  const handleAddCriterion = () => {
    const key = `crit_${Date.now()}`;
    setCriteria([...criteria, { key, name: `Criterion ${criteria.length + 1}`, weight: 10, description: '' }]);

    // Update all options with this new criterion key
    setOptions(options.map(opt => ({
      ...opt,
      criteria: { ...opt.criteria, [key]: 75 },
    })));
  };

  // Remove Criterion
  const handleRemoveCriterion = (idx) => {
    if (criteria.length <= 2) {
      setErrorMsg('At least 2 criteria are required.');
      return;
    }
    const keyToRemove = criteria[idx].key;
    const newCriteria = criteria.filter((_, i) => i !== idx);
    setCriteria(newCriteria);

    // Remove from options
    setOptions(options.map(opt => {
      const updated = { ...opt.criteria };
      delete updated[keyToRemove];
      return { ...opt, criteria: updated };
    }));
  };

  // Update Criterion
  const handleUpdateCriterion = (idx, field, value) => {
    const updated = [...criteria];
    updated[idx][field] = field === 'weight' ? parseFloat(value) || 0 : value;
    setCriteria(updated);
  };

  // Add Option
  const handleAddOption = () => {
    if (options.length >= 10) {
      setErrorMsg('Maximum 10 options allowed.');
      return;
    }
    const id = `opt-${Date.now()}`;
    const defaultScores = {};
    criteria.forEach(c => { defaultScores[c.key] = 75; });
    setOptions([...options, {
      id,
      name: `Candidate Option ${options.length + 1}`,
      description: '',
      criteria: defaultScores,
    }]);
  };

  // Remove Option
  const handleRemoveOption = (idx) => {
    if (options.length <= 2) {
      setErrorMsg('At least 2 options are required.');
      return;
    }
    setOptions(options.filter((_, i) => i !== idx));
  };

  // Update Option Name
  const handleUpdateOptionName = (idx, name) => {
    const updated = [...options];
    updated[idx].name = name;
    setOptions(updated);
  };

  // Update Option Score
  const handleUpdateOptionScore = (optIdx, critKey, score) => {
    const num = Math.min(100, Math.max(0, parseFloat(score) || 0));
    const updated = [...options];
    updated[optIdx].criteria[critKey] = num;
    setOptions(updated);
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Decision title is required.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Decision description is required.');
      return;
    }

    if (!isWeightValid) {
      setErrorMsg(`Criteria weights must sum to exactly 100%. Current sum: ${totalWeight}%`);
      return;
    }

    // Convert weights to dictionary
    const weightsDict = {};
    criteria.forEach(c => {
      weightsDict[c.key] = c.weight;
    });

    const payload = {
      title,
      description,
      category,
      criteria,
      weights: weightsDict,
      options,
    };

    try {
      setIsSubmitting(true);
      const res = await decisionAPI.createDecision(payload);
      if (res.success && res.data?._id) {
        navigate(`/decisions/${res.data._id}`);
      } else {
        setErrorMsg(res.message || 'Failed to create decision.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Server error while creating decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Create Decision Model</h1>
          <p>
            Define evaluation criteria, assign objective weights, and input option performance scores.
          </p>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Load Template:</span>
          <button
            type="button"
            onClick={() => handleLoadPreset('supplier')}
            className="btn btn-sm btn-secondary"
          >
            <Sparkles size={14} color="#a5b4fc" />
            Supplier Selection
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('project')}
            className="btn btn-sm btn-secondary"
          >
            <Sparkles size={14} color="#10b981" />
            Project Prioritization
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner alert-warning">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Step 1: Decision Information */}
        <div className="hitl-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <FileText size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.2rem' }}>1. Decision Information</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Decision Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Select Best Supplier for Industrial Components"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Supplier Selection">Supplier Selection</option>
                <option value="Project Selection">Project Selection</option>
                <option value="Product Selection">Product Selection</option>
                <option value="Vendor Selection">Vendor Selection</option>
                <option value="Investment Selection">Investment Selection</option>
                <option value="Resource Allocation">Resource Allocation</option>
                <option value="Career Decision">Career Decision</option>
                <option value="Event Selection">Event Selection</option>
                <option value="Custom">Custom Domain</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Context & Problem Statement *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe the operational background, constraints, and decision objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Step 2: Evaluation Criteria & Weights */}
        <div className="hitl-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sliders size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.2rem' }}>2. Decision Criteria & Weights</h3>
            </div>

            {/* Live Weight Sum Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total Weight:
              </span>
              <span
                className={`badge ${isWeightValid ? 'badge-success' : 'badge-danger'}`}
                style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}
              >
                {isWeightValid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {totalWeight}% / 100%
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Each criterion defines an evaluation dimension. The sum of all weights must equal 100%.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {criteria.map((crit, idx) => (
              <div
                key={crit.key || idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 100px 3fr 40px',
                  gap: '0.75rem',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Criterion name"
                    value={crit.name}
                    onChange={(e) => handleUpdateCriterion(idx, 'name', e.target.value)}
                    required
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="form-input"
                    placeholder="Weight %"
                    value={crit.weight}
                    onChange={(e) => handleUpdateCriterion(idx, 'weight', e.target.value)}
                    required
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    %
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Description / benchmark indicator"
                    value={crit.description}
                    onChange={(e) => handleUpdateCriterion(idx, 'description', e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCriterion(idx)}
                  className="btn btn-sm btn-secondary"
                  style={{ padding: '0.65rem', color: 'var(--danger)' }}
                  title="Remove criterion"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddCriterion}
            className="btn btn-sm btn-outline-primary"
            style={{ marginTop: '1rem' }}
          >
            <PlusCircle size={15} /> Add Evaluation Criterion
          </button>
        </div>

        {/* Step 3: Candidate Options & Performance Scores */}
        <div className="hitl-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={20} color="#a5b4fc" />
              <h3 style={{ fontSize: '1.2rem' }}>3. Candidate Options & Scores (0–100)</h3>
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="btn btn-sm btn-outline-primary"
            >
              <PlusCircle size={15} /> Add Candidate Option
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Provide objective raw scores (0–100) for each option across all criteria.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {options.map((opt, optIdx) => (
              <div
                key={opt.id || optIdx}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, maxWidth: '350px' }}>
                    <label className="form-label">Option Name:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={opt.name}
                      onChange={(e) => handleUpdateOptionName(optIdx, e.target.value)}
                      required
                    />
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(optIdx)}
                      className="btn btn-sm btn-secondary"
                      style={{ color: 'var(--danger)', height: 'fit-content', marginTop: '1rem' }}
                    >
                      <Trash2 size={15} /> Remove Option
                    </button>
                  )}
                </div>

                {/* Criteria Score Inputs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  {criteria.map((c) => (
                    <div key={c.key}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                        {c.name} ({c.weight}%):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-input"
                        value={opt.criteria[c.key] !== undefined ? opt.criteria[c.key] : 75}
                        onChange={(e) => handleUpdateOptionScore(optIdx, c.key, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={isSubmitting || !isWeightValid}
            className="btn btn-lg btn-primary"
            style={{ minWidth: '240px' }}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                <span>Processing AI Intelligence...</span>
              </>
            ) : (
              <>
                <span>Calculate & Analyze Decision</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
