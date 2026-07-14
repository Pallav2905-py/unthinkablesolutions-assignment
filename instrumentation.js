// Instrumentation file — runs once when Next.js server starts
// Used to initialize background cron jobs

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initCronJobs } = await import('./lib/cron.js');
      initCronJobs();
      console.log('[Instrumentation] Background jobs initialized');
    } catch (err) {
      console.error('[Instrumentation] Failed to initialize cron jobs:', err.message);
    }
  }
}
