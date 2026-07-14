import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth2 authorization URL
 */
export function getAuthUrl(state = '') {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });
}

/**
 * Exchange code for tokens
 */
export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Create a calendar event for an appointment
 * @param {object} tokens - OAuth2 tokens for the user
 * @param {object} appointment - Appointment details
 * @returns {Promise<string|null>} - Calendar event ID or null on failure
 */
export async function createCalendarEvent(tokens, appointment) {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com') {
    console.log('[Calendar] Google OAuth not configured, skipping calendar event creation');
    return null;
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = new Date(`${appointment.date}T${appointment.startTime}:00`);
    const endDateTime = new Date(`${appointment.date}T${appointment.endTime}:00`);

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Medical Appointment — Dr. ${appointment.doctorName}`,
        description: `Healthcare appointment at HealthCare Manager\nSpecialisation: ${appointment.specialisation || 'General'}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
        colorId: '2', // Sage/Green
      },
    });

    return event.data.id;
  } catch (error) {
    console.error('[Calendar] Failed to create event:', error.message);
    return null; // Graceful degradation
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(tokens, eventId, appointment) {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com') {
    return false;
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = new Date(`${appointment.date}T${appointment.startTime}:00`);
    const endDateTime = new Date(`${appointment.date}T${appointment.endTime}:00`);

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Kolkata' },
      },
    });
    return true;
  } catch (error) {
    console.error('[Calendar] Failed to update event:', error.message);
    return false;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(tokens, eventId) {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com') {
    return false;
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return true;
  } catch (error) {
    console.error('[Calendar] Failed to delete event:', error.message);
    return false;
  }
}
