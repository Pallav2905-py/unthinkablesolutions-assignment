'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Star, Clock, DollarSign, MapPin, ChevronRight, Stethoscope, Loader2, X } from 'lucide-react';

const SPECIALISATIONS = [
  'All', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Gynecology', 'Ophthalmology',
  'ENT', 'General Medicine', 'Endocrinology', 'Gastroenterology',
];

function DoctorCard({ doctor }) {
  const name = doctor.userId?.name || 'Doctor';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Link href={`/patient/book/${doctor._id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer',
        transition: 'all 0.25s ease',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(22,163,74,0.12)'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
      >
        {/* Avatar + name */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 4, letterSpacing: '-0.02em' }}>Dr. {name}</h3>
            <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>
              {doctor.specialisation}
            </span>
          </div>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {doctor.bio}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Star size={14} fill="#fbbf24" color="#fbbf24" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{doctor.rating?.toFixed(1) || '—'}</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>({doctor.totalReviews || 0})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
            <Clock size={14} />
            <span style={{ fontSize: 13 }}>{doctor.experience || 0}yr experience</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280' }}>
            <DollarSign size={14} />
            <span style={{ fontSize: 13 }}>₹{doctor.consultationFee || 500}</span>
          </div>
        </div>

        {/* Working days */}
        {doctor.workingHours && doctor.workingHours.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
            {doctor.workingHours.filter(w => w.isAvailable).map((w, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#f3f4f6', color: '#374151' }}>
                {w.day.slice(0, 3)}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="#16a34a" />
            {doctor.slotDurationMinutes || 30} min slots
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
            Book Now <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialisation, setSpecialisation] = useState('All');
  const [total, setTotal] = useState(0);

  const fetchDoctors = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (specialisation !== 'All') params.set('specialisation', specialisation);
    if (search) params.set('search', search);

    const res = await fetch(`/api/doctors?${params}`);
    const data = await res.json();
    setDoctors(data.doctors || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [specialisation]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>
          Find a Doctor 🔍
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Search from {total} specialist doctors available on our platform.</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search by name, specialisation, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 44, fontSize: 14 }} />
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchDoctors(); }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <X size={16} />
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          Search
        </button>
      </form>

      {/* Specialisation filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {SPECIALISATIONS.map((s) => (
          <button key={s} onClick={() => setSpecialisation(s)}
            style={{
              padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: specialisation === s ? '#16a34a' : '#f3f4f6',
              color: specialisation === s ? 'white' : '#374151',
              transition: 'all 0.15s ease',
              boxShadow: specialisation === s ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 24 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 20 }} />)}
        </div>
      ) : doctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Stethoscope size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>No doctors found</h3>
          <p style={{ color: '#9ca3af', marginBottom: 24 }}>Try adjusting your search or specialisation filter.</p>
          <button onClick={() => { setSearch(''); setSpecialisation('All'); }} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            Showing <strong>{doctors.length}</strong> of <strong>{total}</strong> doctors
            {specialisation !== 'All' && <> in <strong>{specialisation}</strong></>}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 24 }}>
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
