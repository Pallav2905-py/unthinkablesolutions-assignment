'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Star, Clock, DollarSign, CalendarOff, Loader2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SPECIALISATIONS = ['Cardiology','Dermatology','Neurology','Orthopedics','Pediatrics','Psychiatry','Gynecology','Ophthalmology','ENT','General Medicine','Endocrinology','Gastroenterology','Pulmonology','Urology'];

function DoctorModal({ doctor, users, onClose, onSave }) {
  const [form, setForm] = useState(doctor ? {
    userId: doctor.userId?._id || '',
    specialisation: doctor.specialisation || '',
    bio: doctor.bio || '',
    experience: doctor.experience || 0,
    consultationFee: doctor.consultationFee || 500,
    slotDurationMinutes: doctor.slotDurationMinutes || 30,
    workingHours: doctor.workingHours || [],
  } : {
    userId: '', specialisation: '', bio: '', experience: 0,
    consultationFee: 500, slotDurationMinutes: 30, workingHours: [],
  });
  const [saving, setSaving] = useState(false);

  const toggleDay = (day) => {
    const existing = form.workingHours.find(w => w.day === day);
    if (existing) {
      setForm(f => ({ ...f, workingHours: f.workingHours.filter(w => w.day !== day) }));
    } else {
      setForm(f => ({ ...f, workingHours: [...f.workingHours, { day, startTime: '09:00', endTime: '17:00', isAvailable: true }] }));
    }
  };

  const updateDayTime = (day, field, value) => {
    setForm(f => ({ ...f, workingHours: f.workingHours.map(w => w.day === day ? { ...w, [field]: value } : w) }));
  };

  const handleSave = async () => {
    if (!form.userId || !form.specialisation) { toast.error('User and specialisation are required'); return; }
    setSaving(true);

    try {
      const url = doctor ? `/api/doctors/${doctor._id}` : '/api/doctors';
      const method = doctor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(doctor ? 'Doctor updated!' : 'Doctor created!');
        onSave(data.doctor);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680, padding: 0 }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {doctor ? 'Edit Doctor Profile' : 'Add New Doctor'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px 28px', overflow: 'auto', maxHeight: '70vh' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {!doctor && (
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label">Select User (Patient who will become Doctor)</label>
                <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="input">
                  <option value="">-- Select User --</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Specialisation</label>
              <select value={form.specialisation} onChange={(e) => setForm({ ...form, specialisation: e.target.value })} className="input">
                <option value="">-- Select --</option>
                {SPECIALISATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience (years)</label>
              <input type="number" min="0" max="60" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} className="input" />
            </div>
            <div>
              <label className="label">Consultation Fee (₹)</label>
              <input type="number" min="0" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: parseInt(e.target.value) || 0 })} className="input" />
            </div>
            <div>
              <label className="label">Slot Duration (minutes)</label>
              <select value={form.slotDurationMinutes} onChange={(e) => setForm({ ...form, slotDurationMinutes: parseInt(e.target.value) })} className="input">
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Doctor's professional bio..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            </div>
          </div>

          {/* Working hours */}
          <div>
            <label className="label" style={{ marginBottom: 12 }}>Working Hours</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.map(day => {
                const wh = form.workingHours.find(w => w.day === day);
                const active = !!wh;
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: active ? '#f0fdf4' : '#f9fafb', border: `1px solid ${active ? '#bbf7d0' : '#f3f4f6'}`, transition: 'all 0.15s' }}>
                    <button onClick={() => toggleDay(day)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {active ? <ToggleRight size={24} color="#16a34a" /> : <ToggleLeft size={24} color="#9ca3af" />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#15803d' : '#9ca3af', width: 90 }}>{day}</span>
                    </button>
                    {active && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="time" value={wh.startTime} onChange={(e) => updateDayTime(day, 'startTime', e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }} />
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>to</span>
                        <input type="time" value={wh.endTime} onChange={(e) => updateDayTime(day, 'endTime', e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : <><Check size={16} /> {doctor ? 'Update Doctor' : 'Create Doctor'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveModal({ doctor, onClose, onSave }) {
  const [dates, setDates] = useState(doctor.leaveDays || []);
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);

  const addDate = () => {
    if (!newDate || dates.includes(newDate)) return;
    setDates([...dates, newDate].sort());
    setNewDate('');
  };

  const removeDate = (d) => setDates(dates.filter(x => x !== d));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/doctors/${doctor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveDays: dates }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Leave days updated! Affected patients notified.');
        onSave(data.doctor);
      } else {
        toast.error(data.error || 'Failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>Manage Leave Days — Dr. {doctor.userId?.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>
              ⚠️ Adding leave days will automatically cancel existing confirmed appointments on those dates and notify affected patients via email.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }} />
            <button onClick={addDate} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {dates.length === 0 && <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: 20 }}>No leave days scheduled</p>}
            {dates.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CalendarOff size={15} color="#f59e0b" />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <button onClick={() => removeDate(d)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#dc2626' }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '20px 28px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Leave Days'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [leaveDoctor, setLeaveDoctor] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [docRes, userRes] = await Promise.all([
      fetch('/api/doctors?limit=100'),
      fetch('/api/admin/users?role=patient'),
    ]);
    const docData = await docRes.json();
    const userData = await userRes.json();
    setDoctors(docData.doctors || []);
    setUsers(userData.users || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = (doctor) => {
    loadData();
    setShowModal(false);
    setEditDoctor(null);
  };

  const handleLeaveSave = (doctor) => {
    loadData();
    setLeaveDoctor(null);
  };

  const toggleActive = async (doctor) => {
    const res = await fetch(`/api/doctors/${doctor._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !doctor.isActive }),
    });
    if (res.ok) {
      toast.success(doctor.isActive ? 'Doctor deactivated' : 'Doctor activated');
      loadData();
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>Manage Doctors 👨‍⚕️</h1>
          <p style={{ color: '#6b7280', fontSize: 15 }}>{doctors.length} doctors on the platform</p>
        </div>
        <button onClick={() => { setEditDoctor(null); setShowModal(true); }} className="btn btn-primary btn-lg">
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />)}
        </div>
      ) : doctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 20, border: '1px dashed #d1d5db' }}>
          <p style={{ color: '#9ca3af', fontSize: 16, marginBottom: 20 }}>No doctors yet. Add your first doctor to get started.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">Add First Doctor</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
          {doctors.map(doctor => {
            const name = doctor.userId?.name || 'Doctor';
            return (
              <div key={doctor._id} style={{
                background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                opacity: doctor.isActive ? 1 : 0.6,
              }}>
                {/* Card header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>Dr. {name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999 }}>{doctor.specialisation}</span>
                      {!doctor.isActive && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>Inactive</span>}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{doctor.experience || 0}yr</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Experience</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>₹{doctor.consultationFee || 500}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Fee</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{doctor.slotDurationMinutes || 30}m</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Slot</div>
                  </div>
                </div>

                {/* Working days */}
                {doctor.workingHours?.length > 0 && (
                  <div style={{ padding: '12px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {doctor.workingHours.filter(w => w.isAvailable).map((w, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#f0fdf4', color: '#15803d' }}>{w.day.slice(0, 3)}</span>
                    ))}
                  </div>
                )}

                {/* Leave days */}
                {doctor.leaveDays?.length > 0 && (
                  <div style={{ padding: '10px 24px', background: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <CalendarOff size={12} color="#f59e0b" />
                      <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>Leave: </span>
                      {doctor.leaveDays.slice(0, 3).map(d => (
                        <span key={d} style={{ fontSize: 11, color: '#92400e', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 4 }}>{d}</span>
                      ))}
                      {doctor.leaveDays.length > 3 && <span style={{ fontSize: 11, color: '#92400e' }}>+{doctor.leaveDays.length - 3} more</span>}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ padding: '14px 24px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => { setEditDoctor(doctor); setShowModal(true); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => setLeaveDoctor(doctor)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <CalendarOff size={13} /> Leave
                  </button>
                  <button onClick={() => toggleActive(doctor)}
                    style={{ padding: '8px 12px', borderRadius: 8, background: doctor.isActive ? '#fee2e2' : '#f0fdf4', color: doctor.isActive ? '#dc2626' : '#16a34a', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {doctor.isActive ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DoctorModal
          doctor={editDoctor}
          users={users}
          onClose={() => { setShowModal(false); setEditDoctor(null); }}
          onSave={handleSave}
        />
      )}

      {leaveDoctor && (
        <LeaveModal
          doctor={leaveDoctor}
          onClose={() => setLeaveDoctor(null)}
          onSave={handleLeaveSave}
        />
      )}
    </div>
  );
}
