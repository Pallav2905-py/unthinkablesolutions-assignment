'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Calendar, Clock, AlertCircle, CheckCircle, Plus, Trash2, Loader2, RefreshCw, FileText, Pill } from 'lucide-react';
import toast from 'react-hot-toast';

const urgencyConfig = {
  High: { bg: '#fee2e2', color: '#991b1b', label: '🔴 High Urgency' },
  Medium: { bg: '#fef3c7', color: '#92400e', label: '🟡 Medium Urgency' },
  Low: { bg: '#f0fdf4', color: '#15803d', label: '🟢 Low Urgency' },
};

function PrescriptionItem({ item, index, onChange, onRemove }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, border: '1px solid #f3f4f6', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>💊 Medication #{index + 1}</span>
        <button onClick={() => onRemove(index)}
          style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#dc2626' }}>
          <Trash2 size={14} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Medication</label>
          <input value={item.medication} onChange={(e) => onChange(index, 'medication', e.target.value)}
            placeholder="e.g. Paracetamol" className="input" style={{ fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Dosage</label>
          <input value={item.dosage} onChange={(e) => onChange(index, 'dosage', e.target.value)}
            placeholder="e.g. 500mg" className="input" style={{ fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Frequency</label>
          <select value={item.frequency} onChange={(e) => onChange(index, 'frequency', e.target.value)} className="input" style={{ fontSize: 13 }}>
            <option>Once daily</option>
            <option>Twice daily</option>
            <option>Thrice daily</option>
            <option>Every 6 hours</option>
            <option>Every 8 hours</option>
            <option>Every 12 hours</option>
            <option>As needed</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Duration</label>
          <input value={item.duration} onChange={(e) => onChange(index, 'duration', e.target.value)}
            placeholder="e.g. 7 days" className="input" style={{ fontSize: 13 }} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Instructions <span style={{ fontWeight: 400 }}>(optional)</span></label>
          <input value={item.instructions || ''} onChange={(e) => onChange(index, 'instructions', e.target.value)}
            placeholder="e.g. Take after meals" className="input" style={{ fontSize: 13 }} />
        </div>
      </div>
    </div>
  );
}

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState('pre-visit');

  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then(r => r.json())
      .then(d => {
        setAppt(d.appointment);
        setNotes(d.appointment?.postVisitNotes || '');
        setPrescription(d.appointment?.prescription || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const addMedication = () => {
    setPrescription([...prescription, { medication: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '', reminderActive: true }]);
  };

  const updateMedication = (index, field, value) => {
    setPrescription(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMedication = (index) => {
    setPrescription(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!notes.trim()) { toast.error('Please add clinical notes before submitting'); return; }
    setSubmitting(true);

    try {
      const res = await fetch(`/api/appointments/${id}/post-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postVisitNotes: notes, prescription }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Post-visit notes saved!');
        setAppt(prev => ({ ...prev, ...data.appointment, postVisitSummary: data.appointment?.postVisitSummary }));
        setActiveTab('post-visit');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const retryAI = async () => {
    setRetrying(true);
    const res = await fetch(`/api/appointments/${id}/post-visit`, { method: 'PUT' });
    const data = await res.json();
    if (res.ok) {
      toast.success('AI summary regenerated!');
      setAppt(prev => ({ ...prev, postVisitSummary: data.summary }));
    } else {
      toast.error(data.error || 'Retry failed');
    }
    setRetrying(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!appt) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <AlertCircle size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
      <h3 style={{ fontSize: 18, fontWeight: 700 }}>Appointment not found</h3>
    </div>
  );

  const patientName = appt.patientId?.name || 'Patient';
  const urgency = appt.preVisitSummary?.urgencyLevel;
  const u = urgency ? urgencyConfig[urgency] : null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <button onClick={() => router.push('/doctor/appointments')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600, fontSize: 14, marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> Back to Appointments
      </button>

      {/* Patient header */}
      <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#0369a1,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
            {patientName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' }}>{patientName}</h1>
              {u && <span style={{ background: u.bg, color: u.color, fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 999 }}>{u.label}</span>}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} color="#16a34a" /> {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color="#16a34a" /> {appt.startTime} – {appt.endTime}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
                background: appt.status === 'confirmed' ? '#f0fdf4' : appt.status === 'completed' ? '#dbeafe' : '#fee2e2',
                color: appt.status === 'confirmed' ? '#16a34a' : appt.status === 'completed' ? '#1e40af' : '#dc2626',
                textTransform: 'capitalize',
              }}>{appt.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          { id: 'pre-visit', label: '🤖 AI Pre-Visit Summary' },
          { id: 'notes', label: '📝 Post-Visit Notes' },
          { id: 'post-visit', label: '✅ Patient Summary' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab ${activeTab === tab.id ? 'active' : ''}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Pre-visit summary */}
      {activeTab === 'pre-visit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Patient symptoms */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="#16a34a" /> Patient's Symptoms
            </h2>
            {appt.symptoms?.text ? (
              <>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 12 }}>{appt.symptoms.text}</p>
                {appt.symptoms.duration && <p style={{ fontSize: 13, color: '#6b7280' }}>Duration: <strong>{appt.symptoms.duration}</strong></p>}
                {appt.symptoms.selfAssessedUrgency && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Self-assessed: <strong>{appt.symptoms.selfAssessedUrgency}</strong> urgency</p>}
                {appt.symptoms.additionalNotes && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Notes: {appt.symptoms.additionalNotes}</p>}
              </>
            ) : <p style={{ fontSize: 14, color: '#9ca3af' }}>No symptoms submitted by patient.</p>}
          </div>

          {/* AI analysis */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={18} color="#7c3aed" /> AI Analysis
            </h2>
            {!appt.preVisitSummary ? (
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16 }}>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>AI analysis pending or not available.</p>
              </div>
            ) : appt.preVisitSummary.failed ? (
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: 16 }}>
                <p style={{ fontSize: 13, color: '#92400e' }}>AI analysis failed. Proceed with patient consultation directly.</p>
              </div>
            ) : (
              <>
                {appt.preVisitSummary.urgencyLevel && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 6 }}>AI Urgency Assessment</div>
                    <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, fontWeight: 800, fontSize: 15, ...urgencyConfig[appt.preVisitSummary.urgencyLevel] }}>
                      {urgencyConfig[appt.preVisitSummary.urgencyLevel]?.label}
                    </div>
                  </div>
                )}
                {appt.preVisitSummary.chiefComplaint && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 6 }}>Chief Complaint</div>
                    <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>{appt.preVisitSummary.chiefComplaint}</p>
                  </div>
                )}
                {appt.preVisitSummary.suggestedQuestions?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10 }}>Suggested Questions</div>
                    <ol style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {appt.preVisitSummary.suggestedQuestions.map((q, i) => (
                        <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>{q}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: Post-visit notes */}
      {activeTab === 'notes' && (
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb' }}>
          {appt.status === 'completed' ? (
            <div style={{ background: '#dbeafe', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', gap: 10 }}>
              <CheckCircle size={18} color="#0369a1" />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>Post-visit notes already submitted</p>
                <p style={{ fontSize: 13, color: '#1e40af', opacity: 0.8 }}>You can update them below and resubmit.</p>
              </div>
            </div>
          ) : null}

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Clinical Notes *</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Patient presents with acute upper respiratory tract infection. Throat is inflamed, temperature 38.5°C. No signs of pneumonia. Prescribed antibiotics and rest..."
              rows={7}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.7, transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Prescription builder */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill size={16} color="#dc2626" /> Prescription
              </label>
              <button onClick={addMedication}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                <Plus size={14} /> Add Medication
              </button>
            </div>
            {prescription.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f9fafb', borderRadius: 12, border: '1px dashed #e5e7eb' }}>
                <p style={{ color: '#9ca3af', fontSize: 13 }}>No medications added. Click "Add Medication" above.</p>
              </div>
            ) : (
              prescription.map((item, i) => (
                <PrescriptionItem key={i} item={item} index={i} onChange={updateMedication} onRemove={removeMedication} />
              ))
            )}
          </div>

          <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', gap: 10 }}>
            <Brain size={18} color="#16a34a" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#15803d' }}>
              After submitting, Groq AI will generate a patient-friendly summary of these clinical notes, including a medication schedule. Medication reminders will also be automatically scheduled.
            </p>
          </div>

          <button onClick={handleSubmit} disabled={submitting || !notes.trim()}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: !notes.trim() ? '#d1d5db' : 'linear-gradient(135deg,#16a34a,#059669)',
              color: 'white', fontWeight: 700, fontSize: 15, border: 'none',
              cursor: !notes.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: notes.trim() ? '0 4px 16px rgba(22,163,74,0.3)' : 'none',
            }}>
            {submitting ? <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving & Generating AI Summary...</> : '✅ Submit Post-Visit Notes'}
          </button>
        </div>
      )}

      {/* Tab: Post-visit summary */}
      {activeTab === 'post-visit' && (
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={20} color="#0369a1" /> Patient-Friendly Summary
            </h2>
            {appt.postVisitNotes && !appt.postVisitSummary && (
              <button onClick={retryAI} disabled={retrying}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#dbeafe', color: '#0369a1', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <RefreshCw size={14} style={{ animation: retrying ? 'spin 0.7s linear infinite' : 'none' }} /> Regenerate AI
              </button>
            )}
          </div>

          {appt.postVisitSummary ? (
            <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap', background: '#f9fafb', padding: 24, borderRadius: 12 }}>
              {appt.postVisitSummary}
            </div>
          ) : appt.postVisitNotes ? (
            <div style={{ background: '#fef3c7', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 600, color: '#92400e', marginBottom: 8 }}>⚠️ AI summary could not be generated</p>
              <p style={{ fontSize: 14, color: '#374151' }}>Clinical notes are saved. Click "Regenerate AI" to retry.</p>
              <div style={{ marginTop: 16, background: 'white', borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{appt.postVisitNotes}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f9fafb', borderRadius: 12 }}>
              <FileText size={40} color="#d1d5db" style={{ marginBottom: 16 }} />
              <p style={{ color: '#9ca3af', fontSize: 14 }}>Post-visit notes not yet submitted. Switch to the "Post-Visit Notes" tab to add them.</p>
              <button onClick={() => setActiveTab('notes')} className="btn btn-primary" style={{ marginTop: 16 }}>Add Clinical Notes</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
