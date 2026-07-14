'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Brain, ChevronRight, Filter, Search, ArrowRight } from 'lucide-react';

const urgencyColors = {
  High: { bg: '#fee2e2', color: '#991b1b', border: '#dc2626' },
  Medium: { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' },
  Low: { bg: '#f0fdf4', color: '#15803d', border: '#16a34a' },
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 100 });
    if (filter !== 'all') params.set('status', filter);
    fetch(`/api/appointments?${params}`)
      .then(r => r.json())
      .then(d => { setAppointments(d.appointments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const filtered = appointments.filter(a => {
    const name = a.patientId?.name?.toLowerCase() || '';
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchDate = !dateFilter || a.date === dateFilter;
    return matchSearch && matchDate;
  });

  // Sort: urgent first, then by date/time
  const sorted = [...filtered].sort((a, b) => {
    const urgencyOrder = { High: 0, Medium: 1, Low: 2, undefined: 3 };
    const ua = urgencyOrder[a.preVisitSummary?.urgencyLevel] ?? 3;
    const ub = urgencyOrder[b.preVisitSummary?.urgencyLevel] ?? 3;
    if (ua !== ub) return ua - ub;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>
          My Appointments 🩺
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>View all patient appointments with AI pre-visit summaries.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search patient..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, height: 38, paddingRight: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', width: 180 }} />
        </div>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', color: '#374151' }} />
        {dateFilter && (
          <button onClick={() => setDateFilter('')}
            style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
            Clear Date
          </button>
        )}
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

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(urgencyColors).map(([level, colors]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors.border }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{level} Urgency</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#e5e7eb' }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>No AI Summary</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 14 }} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 20, border: '1px dashed #d1d5db' }}>
          <Calendar size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>No appointments found</h3>
          <p style={{ color: '#9ca3af' }}>Adjust your filters to see appointments.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(appt => {
            const urgency = appt.preVisitSummary?.urgencyLevel;
            const u = urgency ? urgencyColors[urgency] : null;
            const patientName = appt.patientId?.name || 'Patient';

            return (
              <Link key={appt._id} href={`/doctor/appointments/${appt._id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 14, padding: '18px 24px', border: '1px solid #e5e7eb',
                  borderLeft: `4px solid ${u?.border || '#e5e7eb'}`,
                  display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.borderTopColor = '#e0f2fe'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderTopColor = '#e5e7eb'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0369a1,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {patientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>{patientName}</div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {appt.startTime} – {appt.endTime}
                      </span>
                    </div>
                    {appt.preVisitSummary?.chiefComplaint && (
                      <div style={{ fontSize: 12, color: '#374151', marginTop: 6, background: '#f9fafb', padding: '5px 10px', borderRadius: 6, display: 'inline-block' }}>
                        <Brain size={10} style={{ marginRight: 5, color: '#7c3aed' }} />{appt.preVisitSummary.chiefComplaint}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {u && (
                      <span style={{ background: u.bg, color: u.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Brain size={10} /> {urgency}
                      </span>
                    )}
                    <span style={{
                      background: appt.status === 'confirmed' ? '#f0fdf4' : appt.status === 'completed' ? '#dbeafe' : '#fee2e2',
                      color: appt.status === 'confirmed' ? '#16a34a' : appt.status === 'completed' ? '#1e40af' : '#dc2626',
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, textTransform: 'capitalize',
                    }}>
                      {appt.status}
                    </span>
                    {appt.status === 'completed' && appt.postVisitSummary && (
                      <span style={{ fontSize: 11, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 999 }}>✓ Notes done</span>
                    )}
                  </div>
                  <ChevronRight size={16} color="#9ca3af" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
