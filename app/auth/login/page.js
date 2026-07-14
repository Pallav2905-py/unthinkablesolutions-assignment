'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '../../../lib/auth-client.js';
import { Eye, EyeOff, Stethoscope, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg === 'registered') toast.success('Account created! Please sign in.');
  }, [searchParams]);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await signIn.email({
        email: form.email,
        password: form.password,
      });

      if (result.error) {
        toast.error(result.error.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Redirect based on role
      const role = result.data?.user?.role;
      toast.success('Welcome back!');
      if (role === 'admin') router.push('/admin');
      else if (role === 'doctor') router.push('/doctor');
      else router.push('/patient');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const credentials = {
      patient: { email: 'patient@demo.com', password: 'Demo@1234' },
      doctor: { email: 'doctor@demo.com', password: 'Demo@1234' },
      admin: { email: 'admin@demo.com', password: 'Demo@1234' },
    };
    const cred = credentials[role];
    setForm(cred);
    toast('Filled demo credentials — click Sign In!', { icon: '💡' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0fdf4' }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(150deg,#052e16 0%,#14532d 40%,#16a34a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden',
      }} className="hide-mobile">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(74,222,128,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 350, height: 350, borderRadius: '50%', background: 'rgba(16,185,129,0.07)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Stethoscope size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16 }}>HealthCare Manager</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            AI-powered healthcare appointments for patients, doctors, and clinics.
          </p>

          {[
            '🤖 AI-powered pre-visit summaries',
            '📅 Smart slot booking & reminders',
            '💊 Digital prescriptions & alerts',
            '🔒 Secure role-based access',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, textAlign: 'left' }}>
              <div style={{ flexShrink: 0 }}>{item.split(' ')[0]}</div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{item.slice(3)}</span>
            </div>
          ))}

          <div style={{ marginTop: 40, padding: '16px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unthinkable Solutions</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.6 }}>Building transformative digital products that matter.</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', maxWidth: 560, width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="show-mobile">
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: '#111827' }}>HealthCare Manager</span>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome back 👋</h2>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32 }}>Sign in to your account to continue</p>

          {/* Demo buttons */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Try Demo Accounts</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['patient', 'doctor', 'admin'].map((role) => (
                <button key={role} onClick={() => demoLogin(role)}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'white', border: '1px solid #dcfce7', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                  {role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
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

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                  className={`input ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: 42, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Signing in...</> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, color: '#6b7280', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0fdf4' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
