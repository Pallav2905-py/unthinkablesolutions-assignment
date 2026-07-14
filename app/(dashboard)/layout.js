'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '../../lib/auth-client.js';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText,
  Bell, Settings, LogOut, Menu, X, ChevronRight, Moon, Sun,
  Activity, ClipboardList, UserCog, BarChart3, Home,
} from 'lucide-react';
import toast from 'react-hot-toast';

const navConfig = {
  patient: [
    { href: '/patient', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/patient/doctors', label: 'Find Doctors', icon: Stethoscope },
    { href: '/patient/appointments', label: 'My Appointments', icon: Calendar },
  ],
  doctor: [
    { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { href: '/doctor/schedule', label: 'My Schedule', icon: ClipboardList },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/doctors', label: 'Manage Doctors', icon: UserCog },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

function SidebarLink({ href, label, icon: Icon, active }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 500,
        color: active ? '#15803d' : '#6b7280', margin: '2px 8px',
        background: active ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'transparent',
        borderLeft: active ? '2px solid #16a34a' : '2px solid transparent',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; } }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
      >
        <Icon size={18} />
        <span>{label}</span>
        {active && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#16a34a' }} />}
      </div>
    </Link>
  );
}

export default function DashboardLayout({ children }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (isPending) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const role = session.user?.role || 'patient';
  const links = navConfig[role] || navConfig.patient;
  const userInitials = session.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/auth/login');
  };

  const roleBadgeColor = { patient: '#16a34a', doctor: '#0369a1', admin: '#7c3aed' };
  const roleBg = { patient: '#f0fdf4', doctor: '#dbeafe', admin: '#ede9fe' };
  const roleText = { patient: '#15803d', doctor: '#1e40af', admin: '#5b21b6' };

  const Sidebar = () => (
    <aside style={{
      width: 260, minHeight: '100vh', background: 'white',
      borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
      transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease',
      boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', letterSpacing: '-0.02em' }}>HealthCare</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>MANAGER</div>
          </div>
        </Link>
      </div>

      {/* User profile */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {userInitials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user?.name}</div>
            <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: roleBg[role], color: roleText[role], textTransform: 'capitalize', marginTop: 2 }}>
              {role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', padding: '0 24px 8px' }}>Menu</div>
        {links.map((link) => (
          <SidebarLink
            key={link.href}
            {...link}
            active={pathname === link.href || (link.href !== '/' + role && pathname.startsWith(link.href))}
          />
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={() => setDarkMode(!darkMode)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 14, fontWeight: 500 }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: 260, minHeight: '100vh', background: 'white', borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        flexShrink: 0,
      }} className="hide-mobile">
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', letterSpacing: '-0.02em' }}>HealthCare</div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>MANAGER</div>
            </div>
          </Link>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {userInitials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user?.name}</div>
              <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: roleBg[role], color: roleText[role], textTransform: 'capitalize', marginTop: 2 }}>
                {role}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', padding: '0 24px 8px' }}>Menu</div>
          {links.map((link) => (
            <SidebarLink
              key={link.href}
              {...link}
              active={pathname === link.href || (link.href !== '/' + role && pathname.startsWith(link.href))}
            />
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={() => setDarkMode(!darkMode)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 14, fontWeight: 500 }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{ height: 64, background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="show-mobile"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}>
            <Menu size={22} />
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Home size={14} /> Home
            </Link>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
