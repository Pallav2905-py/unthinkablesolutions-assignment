import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'HealthCare Manager <noreply@healthcare.com>';
const APP_NAME = 'HealthCare Manager';
const GREEN = '#16A34A';

/**
 * Base email HTML template with green theme
 */
function emailTemplate(title, body, ctaText, ctaUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#059669);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🏥 ${APP_NAME}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Unthinkable Solutions</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">${title}</h2>
            ${body}
            ${ctaText && ctaUrl ? `
            <div style="text-align:center;margin:32px 0 0;">
              <a href="${ctaUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">${ctaText}</a>
            </div>` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#6b7280;font-size:13px;">© ${new Date().getFullYear()} ${APP_NAME} by Unthinkable Solutions. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:#6b7280;font-size:14px;width:40%;">${label}</td>
    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

/**
 * Send booking confirmation to patient and doctor
 */
export async function sendBookingConfirmation({ patientEmail, patientName, doctorEmail, doctorName, appointment }) {
  const { date, startTime, endTime, specialisation } = appointment;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const detailsTable = `
  <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
    <tr style="background:#f0fdf4;">
      <td colspan="2" style="padding:12px 16px;font-weight:600;color:#16a34a;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Appointment Details</td>
    </tr>
    <tbody style="padding:0 16px;">
      ${infoRow('📅 Date', new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}
      ${infoRow('⏰ Time', `${startTime} – ${endTime}`)}
      ${infoRow('👨‍⚕️ Doctor', `Dr. ${doctorName}`)}
      ${infoRow('🏥 Specialisation', specialisation || 'General')}
    </tbody>
  </table>`;

  // Patient email
  const patientBody = `
  <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${patientName}</strong>,</p>
  <p style="color:#374151;font-size:15px;line-height:1.6;">Your appointment has been confirmed successfully. Here are your booking details:</p>
  ${detailsTable}
  <p style="color:#374151;font-size:14px;line-height:1.6;">Please arrive 10 minutes early and bring any relevant medical records.</p>`;

  // Doctor email
  const doctorBody = `
  <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>Dr. ${doctorName}</strong>,</p>
  <p style="color:#374151;font-size:15px;line-height:1.6;">A new appointment has been booked with you.</p>
  ${detailsTable.replace('Dr. ' + doctorName, patientName)}`;

  const results = await Promise.allSettled([
    transporter.sendMail({
      from: FROM,
      to: patientEmail,
      subject: `✅ Appointment Confirmed — ${new Date(date).toLocaleDateString()}`,
      html: emailTemplate('Appointment Confirmed!', patientBody, 'View Appointment', `${appUrl}/patient/appointments`),
    }),
    transporter.sendMail({
      from: FROM,
      to: doctorEmail,
      subject: `📅 New Appointment — ${patientName} on ${new Date(date).toLocaleDateString()}`,
      html: emailTemplate('New Appointment Booked', doctorBody, 'View Schedule', `${appUrl}/doctor/appointments`),
    }),
  ]);

  return results.map((r) => r.status === 'fulfilled');
}

/**
 * Send cancellation notification
 */
export async function sendCancellationNotification({ patientEmail, patientName, doctorEmail, doctorName, appointment, reason }) {
  const { date, startTime } = appointment;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const body = (name, isPatient) => `
  <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
  <p style="color:#374151;font-size:15px;line-height:1.6;">Unfortunately, your appointment on <strong>${new Date(date).toLocaleDateString()}</strong> at <strong>${startTime}</strong> has been cancelled.</p>
  ${reason ? `<p style="color:#374151;font-size:14px;background:#fef2f2;border-left:3px solid #ef4444;padding:12px;border-radius:4px;">Reason: ${reason}</p>` : ''}
  ${isPatient ? `<p style="color:#374151;font-size:14px;">Please rebook at your convenience.</p>` : ''}`;

  const results = await Promise.allSettled([
    transporter.sendMail({
      from: FROM,
      to: patientEmail,
      subject: `❌ Appointment Cancelled — ${new Date(date).toLocaleDateString()}`,
      html: emailTemplate('Appointment Cancelled', body(patientName, true), 'Book New Appointment', `${appUrl}/patient/doctors`),
    }),
    transporter.sendMail({
      from: FROM,
      to: doctorEmail,
      subject: `Appointment Cancelled — ${patientName}`,
      html: emailTemplate('Appointment Cancelled', body(`Dr. ${doctorName}`, false), null, null),
    }),
  ]);

  return results.map((r) => r.status === 'fulfilled');
}

/**
 * Send appointment reminder (24h before)
 */
export async function sendAppointmentReminder({ patientEmail, patientName, doctorName, appointment }) {
  const { date, startTime } = appointment;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const body = `
  <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${patientName}</strong>,</p>
  <p style="color:#374151;font-size:15px;line-height:1.6;">This is a reminder that you have an appointment tomorrow:</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#15803d;font-weight:600;">📅 ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at ${startTime}</p>
    <p style="margin:8px 0 0;color:#374151;font-size:14px;">with Dr. ${doctorName}</p>
  </div>
  <p style="color:#374151;font-size:14px;">Please arrive 10 minutes early and bring your ID and insurance card.</p>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: patientEmail,
      subject: `⏰ Appointment Reminder — Tomorrow at ${startTime}`,
      html: emailTemplate('Appointment Reminder', body, 'View Details', `${appUrl}/patient/appointments`),
    });
    return true;
  } catch (err) {
    console.error('[Email] Reminder failed:', err.message);
    return false;
  }
}

/**
 * Send medication reminder
 */
export async function sendMedicationReminder({ patientEmail, patientName, medication, dosage, frequency }) {
  const body = `
  <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${patientName}</strong>,</p>
  <p style="color:#374151;font-size:15px;line-height:1.6;">This is your medication reminder:</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#15803d;font-size:18px;font-weight:700;">💊 ${medication}</p>
    <p style="margin:8px 0 0;color:#374151;">Dosage: <strong>${dosage}</strong></p>
    <p style="margin:4px 0 0;color:#374151;">Frequency: <strong>${frequency}</strong></p>
  </div>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: patientEmail,
      subject: `💊 Medication Reminder — ${medication}`,
      html: emailTemplate('Medication Reminder', body, null, null),
    });
    return true;
  } catch (err) {
    console.error('[Email] Medication reminder failed:', err.message);
    return false;
  }
}

export { transporter };
