'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight, Filter, Search, Brain, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig = {
  confirmed: { color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle, label: 'Confirmed' },
  pending: { color: '#d97706', bg: '#fef3c7', icon: AlertCircle, label: 'Pending' },
  cancelled: { color: '#dc2626', bg: '#fee2e2', icon: XCircle, label: 'Cancelled' },
  completed: { color: '#0369a1', bg: '#dbeafe', icon: CheckCircle, label: 'Completed' },
  no_show: { color: '#6b7280', bg: '#f3f4f6', icon: XCircle, label: 'No Show' },
};

const urgencyConfig = {
  Low: { color: '#16a34a', bg: '#f0fdf4' },
  Medium: { color: '#d97706', bg: '#fef3c7' },
  High: { color: '#dc2626', bg: '#fee2e2' },
};

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, [filter]);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancellationReason: 'Cancelled by patient' }),
      });
      if (res.ok) {
        toast.success('Appointment cancelled. Notification sent.');
        loadAppointments();
      } else {
        toast.error('Failed to cancel. Please try again.');
      }
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = appointments.filter(a => {
    if (!search) return true;
    const docName = a.doctorId?.userId?.name?.toLowerCase() || '';
    const spec = a.doctorId?.specialisation?.toLowerCase() || '';
    return docName.includes(search.toLowerCase()) || spec.includes(search.toLowerCase());
  });

  const upcoming = filtered.filter(a => a.status === 'confirmed' && new Date(a.date) >= new Date());
  const past = filtered.filter(a => a.status !== 'confirmed' || new Date(a.date) < new Date());

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>My Appointments</h1>
          <p style={{ color: '#6b7280', fontSize: 15 }}>Track all your scheduled, completed, and cancelled visits.</p>
        </div>
        <Link href="/patient/doctors" className="btn btn-primary">
          + Book New Appointment
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search by doctor..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, paddingRight: 12, height: 38, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', width: 200 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','All'],['confirmed','Upcoming'],['completed','Completed'],['cancelled','Cancelled']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === val ? '#16a34a' : '#f3f4f6',
                color: filter === val ? 'white' : '#374151',
                transition: 'all 0.15s',
              }}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 20, border: '1px dashed #d1d5db' }}>
          <Calendar size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>No appointments found</h3>
          <p style={{ color: '#9ca3af', marginBottom: 24 }}>
            {filter === 'all' ? "You haven't booked any appointments yet." : `No ${filter} appointments.`}
          </p>
          <Link href="/patient/doctors" className="btn btn-primary">Book an Appointment</Link>
        </div>
      ) : (
        <div>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse-green 2s infinite' }} />
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.map(appt => <AppointmentRow key={appt._id} appt={appt} onCancel={handleCancel} cancellingId={cancellingId} />)}
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Past Appointments ({past.length})</h2>
              {past.map(appt => <AppointmentRow key={appt._id} appt={appt} onCancel={handleCancel} cancellingId={cancellingId} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appt, onCancel, cancellingId }) {
  const s = statusConfig[appt.status] || statusConfig.pending;
  const StatusIcon = s.icon;
  const doctorName = appt.doctorId?.userId?.name || 'Doctor';
  const urgency = appt.preVisitSummary?.urgencyLevel;
  const u = urgency ? urgencyConfig[urgency] : null;
  const canCancel = appt.status === 'confirmed' && new Date(appt.date) > new Date();

  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb',
      marginBottom: 12, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Doctor avatar */}
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
        {doctorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      {/* Details */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>Dr. {doctorName}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{appt.doctorId?.specialisation || 'General'}</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={13} color="#16a34a" /> {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} color="#16a34a" /> {appt.startTime} – {appt.endTime}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
          <StatusIcon size={12} /> {s.label}
        </span>
        {u && (
          <span style={{ background: u.bg, color: u.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Brain size={10} /> AI: {urgency} Urgency
          </span>
        )}
        {appt.postVisitSummary && (
          <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>
            ✓ Summary Ready
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/patient/appointments/${appt._id}`}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          View <ChevronRight size={14} />
        </Link>
        {canCancel && (
          <button onClick={() => onCancel(appt._id)} disabled={cancellingId === appt._id}
            style={{ padding: '8px 12px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
            {cancellingId === appt._id ? '...' : <X size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
