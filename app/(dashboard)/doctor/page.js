'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '../../../lib/auth-client.js';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Brain, ArrowRight, TrendingUp, Activity, Stethoscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfDay, addDays } from 'date-fns';

function StatCard({ icon: Icon, label, value, color, bg, trend }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
        {trend && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '3px 8px', borderRadius: 999 }}>{trend}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const urgencyColors = {
  High: { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
  Medium: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  Low: { bg: '#f0fdf4', color: '#15803d', dot: '#16a34a' },
};

function TodayAppointmentCard({ appt }) {
  const patientName = appt.patientId?.name || 'Patient';
  const urgency = appt.preVisitSummary?.urgencyLevel || null;
  const u = urgency ? urgencyColors[urgency] : null;

  return (
    <Link href={`/doctor/appointments/${appt._id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb',
        marginBottom: 12, cursor: 'pointer', transition: 'all 0.2s ease',
        borderLeft: urgency === 'High' ? '4px solid #dc2626' : urgency === 'Medium' ? '4px solid #f59e0b' : '4px solid #16a34a',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(22,163,74,0.1)'; e.currentTarget.style.borderTopColor = '#bbf7d0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderTopColor = '#e5e7eb'; }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0369a1,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 3 }}>{patientName}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {appt.startTime} – {appt.endTime}
              </span>
              {appt.symptoms?.selfAssessedUrgency && (
                <span style={{ fontSize: 12, color: '#6b7280' }}>Self: {appt.symptoms.selfAssessedUrgency} urgency</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {u && (
              <span style={{ background: u.bg, color: u.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Brain size={10} /> {urgency}
              </span>
            )}
            <ArrowRight size={14} color="#9ca3af" />
          </div>
        </div>
        {appt.preVisitSummary?.chiefComplaint && (
          <div style={{ marginTop: 12, background: '#f9fafb', borderRadius: 8, padding: '8px 12px' }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Chief: </span>
            <span style={{ fontSize: 12, color: '#374151' }}>{appt.preVisitSummary.chiefComplaint}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const [todayAppts, setTodayAppts] = useState([]);
  const [allAppts, setAllAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch('/api/appointments?limit=50')
      .then(r => r.json())
      .then(d => {
        const appts = d.appointments || [];
        setAllAppts(appts);

        const today = format(new Date(), 'yyyy-MM-dd');
        setTodayAppts(appts.filter(a => a.date === today && a.status === 'confirmed').sort((a, b) => a.startTime.localeCompare(b.startTime)));

        // Build chart data for last 7 days
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = format(addDays(new Date(), -6 + i), 'yyyy-MM-dd');
          return { date: format(addDays(new Date(), -6 + i), 'MMM d'), count: appts.filter(a => a.date === d).length };
        });
        setChartData(days);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const completed = allAppts.filter(a => a.status === 'completed').length;
  const pending = allAppts.filter(a => a.status === 'confirmed').length;
  const cancelled = allAppts.filter(a => a.status === 'cancelled').length;
  const name = session?.user?.name?.split(' ')[0] || 'Doctor';

  const highUrgency = todayAppts.filter(a => a.preVisitSummary?.urgencyLevel === 'High').length;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>
          Good morning, Dr. {name}! 🩺
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          You have <strong>{todayAppts.length}</strong> appointments today
          {highUrgency > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}> • {highUrgency} high urgency</span>}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard icon={Calendar} label="Today's Appointments" value={todayAppts.length} color="#16a34a" bg="#f0fdf4" trend="Today" />
        <StatCard icon={CheckCircle} label="Total Completed" value={completed} color="#0369a1" bg="#dbeafe" />
        <StatCard icon={Users} label="Active Patients" value={pending} color="#7c3aed" bg="#ede9fe" />
        <StatCard icon={Activity} label="Cancelled" value={cancelled} color="#dc2626" bg="#fee2e2" />
      </div>

      {highUrgency > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#fee2e2,#fef2f2)', border: '1px solid #fecaca', borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center' }}>
          <AlertCircle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 15 }}>⚠️ {highUrgency} High-Urgency Patient{highUrgency > 1 ? 's' : ''} Today</div>
            <div style={{ color: '#dc2626', fontSize: 13, marginTop: 2 }}>Review AI summaries before these appointments.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Today's schedule */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>Today's Schedule</h2>
            <Link href="/doctor/appointments" style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
            </div>
          ) : todayAppts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 16, border: '1px dashed #d1d5db' }}>
              <Stethoscope size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No appointments scheduled for today</p>
            </div>
          ) : (
            todayAppts.map(appt => <TodayAppointmentCard key={appt._id} appt={appt} />)
          )}
        </div>

        {/* Chart */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>This Week's Activity</h2>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
                    cursor={{ fill: '#f0fdf4' }}
                  />
                  <Bar dataKey="count" name="Appointments" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {chartData.length === 0 && <div className="skeleton" style={{ height: 220, borderRadius: 8 }} />}
          </div>

          {/* Upcoming */}
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>Upcoming Appointments</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allAppts
                .filter(a => a.status === 'confirmed' && a.date > format(new Date(), 'yyyy-MM-dd'))
                .slice(0, 4)
                .map(a => (
                  <Link key={a._id} href={`/doctor/appointments/${a._id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit', transition: 'all 0.15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.background = '#f0fdf4'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontWeight: 700, fontSize: 13 }}>
                      {(a.patientId?.name || 'P').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{a.patientId?.name || 'Patient'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(a.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} · {a.startTime}</div>
                    </div>
                    <ArrowRight size={14} color="#9ca3af" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
