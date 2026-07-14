import cron from 'node-cron';
import { connectDB } from './db.js';
import { sendAppointmentReminder, sendMedicationReminder } from './email.js';

let initialized = false;

export function initCronJobs() {
  if (initialized) return;
  initialized = true;

  // Appointment reminder — runs every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running appointment reminder job...');
    try {
      await connectDB();
      const { default: Appointment } = await import('../models/Appointment.js');
      const { default: User } = await import('../models/User.js');
      const { default: Doctor } = await import('../models/Doctor.js');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const appointments = await Appointment.find({
        date: tomorrowStr,
        status: 'confirmed',
        reminderSent: { $ne: true },
      }).populate('patientId doctorId');

      for (const appt of appointments) {
        if (!appt.patientId?.email) continue;
        const doctor = await Doctor.findById(appt.doctorId).populate('userId');
        const doctorName = doctor?.userId?.name || 'your doctor';

        const sent = await sendAppointmentReminder({
          patientEmail: appt.patientId.email,
          patientName: appt.patientId.name,
          doctorName,
          appointment: appt,
        });

        if (sent) {
          appt.reminderSent = true;
          await appt.save();
        }
      }
      console.log(`[CRON] Sent reminders for ${appointments.length} appointments`);
    } catch (err) {
      console.error('[CRON] Reminder job failed:', err.message);
    }
  });

  // Medication reminder — runs every 8 hours
  cron.schedule('0 */8 * * *', async () => {
    console.log('[CRON] Running medication reminder job...');
    try {
      await connectDB();
      const { default: Appointment } = await import('../models/Appointment.js');

      const now = new Date();
      const appointments = await Appointment.find({
        status: 'completed',
        'prescription.0': { $exists: true },
        'prescription.reminderActive': true,
      }).populate('patientId');

      for (const appt of appointments) {
        if (!appt.patientId?.email) continue;

        for (const med of appt.prescription) {
          if (!med.reminderActive) continue;

          await sendMedicationReminder({
            patientEmail: appt.patientId.email,
            patientName: appt.patientId.name,
            medication: med.medication,
            dosage: med.dosage,
            frequency: med.frequency,
          });
        }
      }
    } catch (err) {
      console.error('[CRON] Medication reminder job failed:', err.message);
    }
  });

  // Retry failed notifications — runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await connectDB();
      const { default: Notification } = await import('../models/Notification.js');

      const failed = await Notification.find({
        status: 'failed',
        retryCount: { $lt: 3 },
        scheduledAt: { $lte: new Date() },
      }).limit(20);

      for (const notif of failed) {
        try {
          // Re-attempt based on notification type
          if (notif.type === 'appointment_reminder') {
            await sendAppointmentReminder(notif.payload);
          } else if (notif.type === 'medication_reminder') {
            await sendMedicationReminder(notif.payload);
          }
          notif.status = 'sent';
          notif.sentAt = new Date();
        } catch {
          notif.retryCount += 1;
          if (notif.retryCount >= 3) {
            notif.status = 'permanently_failed';
          }
        }
        await notif.save();
      }
    } catch (err) {
      console.error('[CRON] Retry job failed:', err.message);
    }
  });

  console.log('[CRON] Background jobs initialized');
}
