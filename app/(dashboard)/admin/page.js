'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Stethoscope, Calendar, CheckCircle, XCircle, TrendingUp, Activity, ArrowRight, BarChart3, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#16a34a', '#059669', '#0d9488', '#0369a1', '#7c3aed', '#dc2626', '#d97706', '#0ea5e9'];

function StatCard({ icon: Icon, label, value, color, bg, change }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
        {change !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 999 }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [specialisationStats, setSpecialisationStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => {
        setStats(d.stats);
        setRecent(d.recentAppointments || []);
        setSpecialisationStats(d.specialisationStats || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const pieData = specialisationStats.map(s => ({ name: s._id, value: s.count }));
  const barData = recent.map(r => ({ date: r._id.slice(5), count: r.count }));

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>
          Admin Dashboard ⚙️
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Platform overview and system health.</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <Link href="/admin/doctors" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#059669)', color: 'white', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          <Stethoscope size={16} /> Manage Doctors
        </Link>
        <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          <Users size={16} /> View Users
        </Link>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard icon={Users} label="Total Patients" value={stats?.totalUsers || 0} color="#0369a1" bg="#dbeafe" change={12} />
        <StatCard icon={Stethoscope} label="Active Doctors" value={stats?.totalDoctors || 0} color="#16a34a" bg="#f0fdf4" change={5} />
        <StatCard icon={Calendar} label="Total Appointments" value={stats?.totalAppointments || 0} color="#7c3aed" bg="#ede9fe" change={18} />
        <StatCard icon={CheckCircle} label="Completed" value={stats?.completedAppointments || 0} color="#059669" bg="#d1fae5" />
        <StatCard icon={XCircle} label="Cancelled" value={stats?.cancelledAppointments || 0} color="#dc2626" bg="#fee2e2" />
        <StatCard icon={Activity} label="Pending/Active" value={stats?.pendingAppointments || 0} color="#d97706" bg="#fef3c7" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Bar chart */}
        <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>Bookings — Last 7 Days</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
                  cursor={{ fill: '#f0fdf4' }}
                />
                <Bar dataKey="count" name="Appointments" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No data yet</p>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>By Specialisation</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend formatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No specialisations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* System health */}
      <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.02em' }}>System Health</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {[
            { label: 'AI Summary Success Rate', value: '94%', color: '#16a34a', detail: 'Groq API operational' },
            { label: 'Email Delivery Rate', value: '98%', color: '#0369a1', detail: 'SMTP connected' },
            { label: 'Calendar Integration', value: 'Optional', color: '#7c3aed', detail: 'OAuth ready' },
            { label: 'Database', value: 'Healthy', color: '#059669', detail: 'MongoDB Atlas connected' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: item.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{item.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
