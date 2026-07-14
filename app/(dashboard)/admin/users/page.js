'use client';

import { useEffect, useState } from 'react';
import { Search, Users, UserCheck, Stethoscope, Shield } from 'lucide-react';

const roleConfig = {
  patient: { bg: '#dbeafe', color: '#1e40af', icon: Users, label: 'Patient' },
  doctor: { bg: '#f0fdf4', color: '#15803d', icon: Stethoscope, label: 'Doctor' },
  admin: { bg: '#ede9fe', color: '#5b21b6', icon: Shield, label: 'Admin' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('role', filter);
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const filtered = users.filter(u => {
    if (!search) return true;
    return u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Users 👥</h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>{filtered.length} users registered on the platform</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, height: 38, paddingRight: 12, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', width: 220 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','All'],['patient','Patients'],['doctor','Doctors'],['admin','Admins']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === val ? '#16a34a' : '#f3f4f6',
                color: filter === val ? 'white' : '#374151',
              }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['User', 'Email', 'Role', 'Phone', 'Joined'].map(h => (
                <th key={h} style={{ padding: '12px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: '16px 20px' }}>
                      <div className="skeleton" style={{ height: 16, borderRadius: 4, width: j === 0 ? 140 : j === 3 ? 80 : 120 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>No users found</td>
              </tr>
            ) : filtered.map(user => {
              const role = roleConfig[user.role] || roleConfig.patient;
              const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
              return (
                <tr key={user._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{user.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: role.bg, color: role.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>
                      {role.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{user.phone || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
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
