'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Brain, Bell, Shield, Users,
  ChevronRight, Star, CheckCircle, Stethoscope,
  Activity, FileText, Zap, Menu, X, ArrowRight,
  Heart, Phone, Mail
} from 'lucide-react';

function CountUp({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const features = [
  { icon: Brain, title: 'AI-Powered Summaries', desc: 'Groq AI analyses symptoms and generates urgency-level pre-visit summaries for doctors, and patient-friendly post-visit reports.', color: '#7c3aed' },
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Real-time slot availability, atomic booking with double-booking prevention, and 5-minute slot holds for concurrent users.', color: '#16a34a' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Automated email reminders, medication alerts, and Google Calendar integration — with 3-retry notification reliability.', color: '#d97706' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Separate secure portals for Patients, Doctors, and Admins with Better Auth and session management.', color: '#0369a1' },
  { icon: FileText, title: 'Digital Prescriptions', desc: 'Doctors write digital prescriptions post-visit; patients receive automated medication schedules and reminders.', color: '#dc2626' },
  { icon: Activity, title: 'Analytics Dashboard', desc: 'Real-time charts for appointment trends, specialisation heatmaps, and system health monitoring for admins.', color: '#059669' },
];

const stats = [
  { value: 500, suffix: '+', label: 'Doctors Onboarded' },
  { value: 12000, suffix: '+', label: 'Appointments Booked' },
  { value: 98, suffix: '%', label: 'On-Time Notifications' },
  { value: 4.9, suffix: '/5', label: 'Patient Satisfaction' },
];

const steps = [
  { num: '01', title: 'Register & Search', desc: 'Patients sign up and search doctors by specialisation, rating, and availability.' },
  { num: '02', title: 'Book & Describe', desc: 'Select a time slot and fill out a symptom form. AI instantly generates an urgency assessment.' },
  { num: '03', title: 'Doctor Reviews', desc: 'Doctors receive AI pre-visit summaries with chief complaint and suggested questions.' },
  { num: '04', title: 'Post-Visit Care', desc: 'After the visit, doctors submit notes. AI creates a patient-friendly summary with medication schedule.' },
];

const testimonials = [
  { name: 'Dr. Priya Sharma', role: 'Cardiologist', text: 'The AI pre-visit summaries save me 10 minutes per patient. I know exactly what to expect before they walk in.', rating: 5, avatar: 'PS' },
  { name: 'Rahul Mehta', role: 'Patient', text: 'Booked my appointment in under 2 minutes. Got the confirmation email and calendar invite instantly!', rating: 5, avatar: 'RM' },
  { name: 'Dr. Aditya Verma', role: 'Neurologist', text: 'The prescription-to-reminder pipeline is brilliant. My patients actually take their medications on time.', rating: 5, avatar: 'AV' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#111827' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid #e5e7eb' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: scrolled ? '#111827' : 'white', letterSpacing: '-0.03em' }}>
              HealthCare<span style={{ color: '#4ade80' }}>Manager</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="hide-mobile">
            {['Features', 'How It Works', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ','-')}`}
                style={{ padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: scrolled ? '#374151' : 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'all 0.2s' }}>
                {item}
              </a>
            ))}
            <Link href="/auth/login"
              style={{ padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: scrolled ? '#16a34a' : 'white', border: `1.5px solid ${scrolled ? '#16a34a' : 'rgba(255,255,255,0.5)'}`, textDecoration: 'none', transition: 'all 0.2s', marginLeft: 8 }}>
              Sign In
            </Link>
            <Link href="/auth/register"
              style={{ padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'linear-gradient(135deg,#16a34a,#059669)', color: 'white', textDecoration: 'none', boxShadow: '0 2px 8px rgba(22,163,74,0.35)', transition: 'all 0.2s' }}>
              Get Started
            </Link>
          </div>

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? '#111827' : 'white' }}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/auth/login" style={{ padding: '12px 16px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
            <Link href="/auth/register" style={{ padding: '12px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#16a34a,#059669)', color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(150deg,#052e16 0%,#14532d 30%,#15803d 65%,#16a34a 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 72,
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'rgba(74,222,128,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 32 }}>
            <Zap size={14} color="#4ade80" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80', letterSpacing: '0.05em' }}>AI-POWERED HEALTHCARE PLATFORM</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px,6vw,80px)', fontWeight: 900, color: 'white', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 24 }}>
            Healthcare Appointments,<br />
            <span style={{ background: 'linear-gradient(135deg,#4ade80,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Reimagined with AI</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,0.75)', maxWidth: 640, margin: '0 auto 48px', lineHeight: 1.7 }}>
            A complete healthcare platform where patients book appointments, doctors get AI-powered pre-visit briefings, and everyone stays connected through smart notifications.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register?role=patient"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#16a34a,#059669)', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 30px rgba(22,163,74,0.4)', transition: 'all 0.2s' }}>
              Book an Appointment <ArrowRight size={18} />
            </Link>
            <Link href="/auth/register?role=doctor"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none', transition: 'all 0.2s' }}>
              Join as Doctor <Stethoscope size={18} />
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {['HIPAA Compliant', 'End-to-end Encrypted', '99.9% Uptime', 'GDPR Ready'].map((b) => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                <CheckCircle size={14} color="#4ade80" /> {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#16a34a', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 0 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px 24px', borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
                <CountUp end={parseFloat(s.value)} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '100px 24px', background: '#fafafa' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#16a34a', textTransform: 'uppercase' }}>Platform Features</span>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginTop: 12, letterSpacing: '-0.03em' }}>
              Everything a modern clinic needs
            </h2>
            <p style={{ color: '#6b7280', fontSize: 17, marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
              From AI symptom analysis to medication reminders — all in one elegant platform.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: 16,
                padding: 32,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.25s ease',
                cursor: 'default',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <f.icon size={26} color={f.color} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '100px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#16a34a', textTransform: 'uppercase' }}>Process</span>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginTop: 12, letterSpacing: '-0.03em' }}>How it works</h2>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 40, left: '10%', right: '10%', height: 2, background: 'linear-gradient(90deg,#16a34a,#059669)', opacity: 0.2, zIndex: 0 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 32, position: 'relative', zIndex: 1 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(22,163,74,0.3)' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{s.num}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '100px 24px', background: '#f0fdf4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#16a34a', textTransform: 'uppercase' }}>Testimonials</span>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginTop: 12, letterSpacing: '-0.03em' }}>Loved by doctors & patients</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #dcfce7', boxShadow: '0 4px 20px rgba(22,163,74,0.07)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={16} fill="#16a34a" color="#16a34a" />)}
                </div>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg,#052e16,#14532d,#16a34a)', padding: '100px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <Heart size={48} color="#4ade80" style={{ marginBottom: 24 }} />
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 20 }}>
            Start managing healthcare smarter today
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, marginBottom: 40, lineHeight: 1.7 }}>
            Join hundreds of clinics already using HealthCare Manager to deliver better patient experiences.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{ padding: '16px 40px', borderRadius: 12, background: 'white', color: '#16a34a', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
              Get Started Free
            </Link>
            <Link href="/auth/login" style={{ padding: '16px 40px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#052e16', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, color: 'white', fontSize: 15 }}>HealthCare Manager</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { icon: Mail, text: 'hello@healthcare.com' },
              { icon: Phone, text: '+91 98765 43210' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                <item.icon size={14} color="#4ade80" /> {item.text}
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            © {new Date().getFullYear()} Unthinkable Solutions
          </p>
        </div>
      </footer>
    </div>
  );
}
