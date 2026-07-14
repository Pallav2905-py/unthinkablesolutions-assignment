'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp } from '../../../lib/auth-client.js';
import { Eye, EyeOff, Stethoscope, Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const roles = [
  { id: 'patient', label: '🏥 Patient', desc: 'Book appointments & track health' },
  { id: 'doctor', label: '👨‍⚕️ Doctor', desc: 'Manage schedule & patient notes' },
  { id: 'admin', label: '⚙️ Admin', desc: 'Manage the entire platform' },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: searchParams.get('role') || 'patient',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        phone: form.phone,
      });

      if (result.error) {
        toast.error(result.error.message || 'Registration failed');
        setLoading(false);
        return;
      }

      toast.success('Account created successfully!');
      router.push('/auth/login?message=registered');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passwordStrength();
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0fdf4' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, background: 'linear-gradient(150deg,#052e16 0%,#14532d 40%,#16a34a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden',
      }} className="hide-mobile">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(74,222,128,0.08)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Stethoscope size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16 }}>Join HealthCare Manager</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Create your account and experience the future of healthcare management.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Choose your role</p>
            {roles.map((r) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                background: form.role === r.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: form.role === r.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
              }} onClick={() => setForm({ ...form, role: r.id })}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{r.desc}</div>
                </div>
                {form.role === r.id && <CheckCircle size={16} color="#4ade80" style={{ marginLeft: 'auto' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>HealthCare Manager</span>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Create your account</h2>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32 }}>Get started in under 60 seconds</p>

          {/* Mobile role selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }} className="show-mobile">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setForm({ ...form, role: r.id })}
                style={{
                  flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: form.role === r.id ? '#16a34a' : '#f9fafb',
                  color: form.role === r.id ? 'white' : '#374151',
                  border: form.role === r.id ? 'none' : '1px solid #e5e7eb',
                  textTransform: 'capitalize',
                }}>
                {r.id}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: 18 }}>
              <label className="label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="text" placeholder="Dr. Jane Smith / John Doe"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                  className={`input ${errors.name ? 'error' : ''}`}
                  style={{ paddingLeft: 42 }} />
              </div>
              {errors.name && <p className="error-message">{errors.name}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="email" placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                  className={`input ${errors.email ? 'error' : ''}`}
                  style={{ paddingLeft: 42 }} />
              </div>
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 18 }}>
              <label className="label">Phone Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="tel" placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                  style={{ paddingLeft: 42 }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                  className={`input ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: 42, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : '#e5e7eb', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: strengthColors[strength] || '#6b7280' }}>
                    {strengthLabels[strength] || 'Enter password'}
                  </p>
                </div>
              )}
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: loading ? '#86efac' : 'linear-gradient(135deg,#16a34a,#059669)',
                color: 'white', fontWeight: 700, fontSize: 15, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(22,163,74,0.3)', transition: 'all 0.2s',
              }}>
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating account...</> : <>Create Account <ArrowRight size={18} /></>}
            </button>

            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 14 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0fdf4' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
