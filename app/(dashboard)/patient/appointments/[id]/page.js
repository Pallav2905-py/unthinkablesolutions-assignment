'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, Calendar, Clock, Stethoscope, Pill, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientAppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then(r => r.json())
      .then(d => { setAppt(d.appointment); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const retryAiSummary = async () => {
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
      <button onClick={() => router.push('/patient/appointments')} className="btn btn-secondary" style={{ marginTop: 16 }}>
        Back to Appointments
      </button>
    </div>
  );

  const doctorName = appt.doctorId?.userId?.name || 'Doctor';
  const statusConfig = {
    confirmed: { color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle, label: 'Confirmed' },
    pending: { color: '#d97706', bg: '#fef3c7', icon: AlertCircle, label: 'Pending' },
    cancelled: { color: '#dc2626', bg: '#fee2e2', icon: XCircle, label: 'Cancelled' },
    completed: { color: '#0369a1', bg: '#dbeafe', icon: CheckCircle, label: 'Completed' },
  };
  const s = statusConfig[appt.status] || statusConfig.pending;
  const StatusIcon = s.icon;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <button onClick={() => router.push('/patient/appointments')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600, fontSize: 14, marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> Back to Appointments
      </button>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
            {doctorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' }}>Dr. {doctorName}</h1>
              <span style={{ background: s.bg, color: s.color, fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
                <StatusIcon size={13} /> {s.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Stethoscope size={13} color="#16a34a" /> {appt.doctorId?.specialisation || 'General'}
              </span>
              <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} color="#16a34a" /> {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color="#16a34a" /> {appt.startTime} – {appt.endTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Symptoms */}
          {appt.symptoms?.text && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#16a34a" /> Your Symptoms
              </h2>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>{appt.symptoms.text}</p>
              {appt.symptoms.duration && (
                <p style={{ fontSize: 13, color: '#6b7280' }}>Duration: <strong>{appt.symptoms.duration}</strong></p>
              )}
              {appt.symptoms.additionalNotes && (
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>Additional: {appt.symptoms.additionalNotes}</p>
              )}
            </div>
          )}

          {/* AI Pre-visit summary */}
          {appt.preVisitSummary && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={18} color="#7c3aed" /> AI Pre-Visit Analysis
              </h2>
              {appt.preVisitSummary.failed ? (
                <div style={{ background: '#fef3c7', borderRadius: 10, padding: 16 }}>
                  <p style={{ fontSize: 13, color: '#92400e' }}>AI analysis could not be generated. The appointment will proceed normally.</p>
                </div>
              ) : (
                <>
                  {appt.preVisitSummary.urgencyLevel && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgency Level</span>
                      <div style={{
                        display: 'inline-block', marginLeft: 12, padding: '3px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                        background: appt.preVisitSummary.urgencyLevel === 'High' ? '#fee2e2' : appt.preVisitSummary.urgencyLevel === 'Medium' ? '#fef3c7' : '#f0fdf4',
                        color: appt.preVisitSummary.urgencyLevel === 'High' ? '#991b1b' : appt.preVisitSummary.urgencyLevel === 'Medium' ? '#92400e' : '#15803d',
                      }}>
                        {appt.preVisitSummary.urgencyLevel}
                      </div>
                    </div>
                  )}
                  {appt.preVisitSummary.chiefComplaint && (
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Chief Complaint</span>
                      <p style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{appt.preVisitSummary.chiefComplaint}</p>
                    </div>
                  )}
                  {appt.preVisitSummary.suggestedQuestions?.length > 0 && (
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Suggested Questions</span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {appt.preVisitSummary.suggestedQuestions.map((q, i) => (
                          <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#16a34a' }}>{i + 1}</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Post-visit summary */}
          {(appt.postVisitSummary || appt.postVisitNotes) && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={18} color="#0369a1" /> After-Visit Summary
                </h2>
                {!appt.postVisitSummary && appt.postVisitNotes && (
                  <button onClick={retryAiSummary} disabled={retrying}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#dbeafe', color: '#0369a1', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    <RefreshCw size={12} style={{ animation: retrying ? 'spin 0.7s linear infinite' : 'none' }} /> Retry AI
                  </button>
                )}
              </div>
              {appt.postVisitSummary ? (
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{appt.postVisitSummary}</div>
              ) : (
                <div style={{ background: '#fef3c7', borderRadius: 10, padding: 16 }}>
                  <p style={{ fontSize: 13, color: '#92400e', fontWeight: 500, marginBottom: 6 }}>AI summary not yet generated</p>
                  <p style={{ fontSize: 13, color: '#374151' }}>{appt.postVisitNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Prescription */}
          {appt.prescription?.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill size={18} color="#dc2626" /> Prescription
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {appt.prescription.map((med, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: 16, border: '1px solid #f3f4f6' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 6 }}>💊 {med.medication}</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Dosage: <strong>{med.dosage}</strong></span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Frequency: <strong>{med.frequency}</strong></span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Duration: <strong>{med.duration}</strong></span>
                    </div>
                    {med.instructions && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>📝 {med.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation reason */}
          {appt.status === 'cancelled' && appt.cancellationReason && (
            <div style={{ background: '#fee2e2', borderRadius: 16, padding: 20, border: '1px solid #fecaca' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={16} /> Cancellation Reason
              </h2>
              <p style={{ fontSize: 14, color: '#374151' }}>{appt.cancellationReason}</p>
              <Link href="/patient/doctors" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                Book a New Appointment
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
