// Admin appointments page — redirect to appointments with admin view
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Brain, Search, ChevronRight } from 'lucide-react';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Admin fetches all appointments
    fetch('/api/appointments?limit=100')
      .then(r => r.json())
      .then(d => { setAppointments(d.appointments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = appointments.filter(a => {
    const patient = a.patientId?.name?.toLowerCase() || '';
    const doctor = a.doctorId?.userId?.name?.toLowerCase() || '';
    const matchSearch = !search || patient.includes(search.toLowerCase()) || doctor.includes(search.toLowerCase());
    const matchStatus = filter === 'all' || a.status === filter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>All Appointments 📅</h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>{filtered.length} appointments total</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search patient or doctor..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, height: 38, paddingRight: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', width: 240 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','All'],['confirmed','Confirmed'],['completed','Completed'],['cancelled','Cancelled']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === val ? '#16a34a' : '#f3f4f6', color: filter === val ? 'white' : '#374151' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Patient', 'Doctor', 'Date & Time', 'Status', 'AI Urgency', ''].map(h => (
                <th key={h} style={{ padding: '12px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length:5}).map((_,i) => (
                <tr key={i}>
                  {Array.from({length:6}).map((_,j) => (
                    <td key={j} style={{ padding: '16px 20px' }}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.slice(0, 50).map(a => {
              const s = { confirmed: ['#f0fdf4','#15803d'], completed: ['#dbeafe','#1e40af'], cancelled: ['#fee2e2','#991b1b'], pending: ['#fef3c7','#92400e'] }[a.status] || ['#f3f4f6','#6b7280'];
              const urgency = a.preVisitSummary?.urgencyLevel;
              const uc = { High: ['#fee2e2','#991b1b'], Medium: ['#fef3c7','#92400e'], Low: ['#f0fdf4','#15803d'] }[urgency];
              return (
                <tr key={a._id} style={{ borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14 }}>{a.patientId?.name || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#374151' }}>Dr. {a.doctorId?.userId?.name || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={12} /> {a.date}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}><Clock size={12} /> {a.startTime}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: s[0], color: s[1], fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{a.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {uc ? <span style={{ background: uc[0], color: uc[1], fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}><Brain size={10} />{urgency}</span> : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <ChevronRight size={16} color="#9ca3af" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
