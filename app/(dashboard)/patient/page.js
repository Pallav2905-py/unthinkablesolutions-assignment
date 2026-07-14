'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '../../../lib/auth-client.js';
import { Calendar, Clock, Stethoscope, ArrowRight, TrendingUp, AlertCircle, CheckCircle, XCircle, Brain, Activity } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, bg, change }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
        {change && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 999 }}>
            {change}
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function AppointmentCard({ appt }) {
  const statusColors = {
    confirmed: { bg: '#f0fdf4', color: '#16a34a', label: 'Confirmed' },
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    completed: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
  };
  const s = statusColors[appt.status] || statusColors.pending;
  const doctorName = appt.doctorId?.userId?.name || 'Doctor';
  const specialisation = appt.doctorId?.specialisation || 'General';

  return (
    <Link href={`/patient/appointments/${appt._id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
        transition: 'all 0.2s ease', marginBottom: 12,
      }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.1)'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
          {doctorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Dr. {doctorName}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{specialisation}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> {new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {appt.startTime} – {appt.endTime}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>{s.label}</span>
          {appt.preVisitSummary?.urgencyLevel && (
            <span style={{
              background: appt.preVisitSummary.urgencyLevel === 'High' ? '#fee2e2' : appt.preVisitSummary.urgencyLevel === 'Medium' ? '#fef3c7' : '#f0fdf4',
              color: appt.preVisitSummary.urgencyLevel === 'High' ? '#991b1b' : appt.preVisitSummary.urgencyLevel === 'Medium' ? '#92400e' : '#15803d',
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Brain size={10} /> {appt.preVisitSummary.urgencyLevel}
            </span>
          )}
        </div>
        <ArrowRight size={16} color="#9ca3af" />
      </div>
    </Link>
  );
}

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/appointments?limit=5')
      .then(r => r.json())
      .then(d => { setAppointments(d.appointments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => a.status === 'confirmed' && new Date(a.date) >= new Date());
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  const name = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Welcome header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>
          Good morning, {name}! 👋
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Here's an overview of your health appointments.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard icon={Calendar} label="Upcoming Appointments" value={upcoming.length} color="#16a34a" bg="#f0fdf4" change="+1 this week" />
        <StatCard icon={CheckCircle} label="Completed Visits" value={completed} color="#0369a1" bg="#dbeafe" />
        <StatCard icon={XCircle} label="Cancelled" value={cancelled} color="#dc2626" bg="#fee2e2" />
        <StatCard icon={Activity} label="Total Appointments" value={appointments.length} color="#7c3aed" bg="#ede9fe" />
      </div>

      {/* Quick actions */}
      <div style={{ background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: 20, padding: '28px 32px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Ready to book your next appointment?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Search from 500+ specialist doctors by specialisation.</p>
        </div>
        <Link href="/patient/doctors"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'white', color: '#16a34a', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
          Find a Doctor <ArrowRight size={16} />
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent appointments */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>Recent Appointments</h2>
            <Link href="/patient/appointments" style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />)}
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 16, border: '1px dashed #d1d5db' }}>
              <Calendar size={40} color="#d1d5db" style={{ marginBottom: 16 }} />
              <p style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>No appointments yet</p>
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>Book your first appointment today!</p>
              <Link href="/patient/doctors" style={{ padding: '10px 24px', borderRadius: 8, background: '#16a34a', color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                Find Doctors
              </Link>
            </div>
          ) : (
            appointments.map(appt => <AppointmentCard key={appt._id} appt={appt} />)
          )}
        </div>

        {/* Health tips */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>Health Tips</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '💧', title: 'Stay Hydrated', tip: 'Drink 8+ glasses of water daily for optimal health.' },
              { icon: '🏃', title: 'Move Daily', tip: '30 minutes of exercise can improve your mood significantly.' },
              { icon: '😴', title: 'Sleep Well', tip: 'Aim for 7-9 hours of quality sleep every night.' },
              { icon: '🥦', title: 'Eat Balanced', tip: 'Include vegetables in every meal for vitamins and fiber.' },
            ].map((tip, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #e5e7eb', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 4 }}>{tip.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{tip.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
