import React, { useState } from 'react';

export default function NewAcademicYearModal({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copySettings, setCopySettings] = useState(true);
  const [terms, setTerms] = useState(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for creating the academic year would go here
    // including creating terms and copying settings
    console.log({ name, startDate, endDate, copySettings, terms });
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', padding: 32, borderRadius: 12, maxWidth: 500, width: '100%' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 20 }}>Create Academic Year</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Academic Year Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. 2025-2026"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-body)' }}
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-body)' }}
                required 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-body)' }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Number of Terms</label>
            <select 
              value={terms} 
              onChange={e => setTerms(parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-body)' }}
            >
              <option value={2}>2 Terms</option>
              <option value={3}>3 Terms</option>
              <option value={4}>4 Terms (Quarters)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: 'rgba(79, 70, 229, 0.05)', borderRadius: 8, border: '1px solid rgba(79, 70, 229, 0.2)', marginTop: 8 }}>
            <input 
              type="checkbox" 
              id="copy-settings" 
              checked={copySettings} 
              onChange={e => setCopySettings(e.target.checked)} 
              style={{ width: 18, height: 18, marginTop: 2 }}
            />
            <label htmlFor="copy-settings" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Copy settings from previous year</strong>
              Copies class structure, subject assignments, and teacher assignments. Students will not be copied.
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Year</button>
          </div>
        </form>
      </div>
    </div>
  );
}
