import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: {
    template: '%s | HealthCare Manager',
    default: 'HealthCare Manager — Unthinkable Solutions',
  },
  description: 'A production-ready healthcare appointment and follow-up management platform with AI-powered summaries, doctor scheduling, and patient-friendly reports.',
  keywords: ['healthcare', 'appointments', 'doctors', 'patients', 'medical', 'AI'],
  authors: [{ name: 'Unthinkable Solutions' }],
  openGraph: {
    title: 'HealthCare Manager',
    description: 'Streamline healthcare appointments with AI-powered insights',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
