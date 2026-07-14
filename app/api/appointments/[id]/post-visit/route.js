import { connectDB } from '../../../../../lib/db.js';
import Appointment from '../../../../../models/Appointment.js';
import Doctor from '../../../../../models/Doctor.js';
import User from '../../../../../models/User.js';
import { auth } from '../../../../../lib/auth.js';
import { headers } from 'next/headers';
import { generatePostVisitSummary } from '../../../../../lib/groq.js';

// POST /api/appointments/[id]/post-visit — doctor submits notes and prescription
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'doctor') {
      return Response.json({ error: 'Only doctors can submit post-visit notes' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const { postVisitNotes, prescription } = await request.json();

    if (!postVisitNotes) {
      return Response.json({ error: 'Post-visit notes are required' }, { status: 400 });
    }

    const appointment = await Appointment.findById(id).populate('patientId', 'name email');
    if (!appointment) return Response.json({ error: 'Appointment not found' }, { status: 404 });

    // Verify doctor owns this appointment
    const doctor = await Doctor.findOne({ userId: session.user.id });
    if (!doctor || doctor._id.toString() !== appointment.doctorId.toString()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Save notes and prescription
    appointment.postVisitNotes = postVisitNotes;
    appointment.prescription = prescription || [];
    appointment.status = 'completed';

    // Generate AI patient-friendly summary (awaited so we can return it)
    let summary = null;
    try {
      summary = await generatePostVisitSummary(postVisitNotes, prescription || []);
    } catch (err) {
      console.error('[PostVisit] AI summary failed:', err.message);
    }

    appointment.postVisitSummary = summary || null;
    await appointment.save();

    return Response.json({
      appointment,
      aiSummaryGenerated: !!summary,
      message: summary
        ? 'Post-visit summary generated and saved!'
        : 'Notes saved. AI summary could not be generated — you can retry.',
    });
  } catch (err) {
    console.error('[API/post-visit]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/appointments/[id]/post-visit — retry AI summary generation
export async function PUT(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const appointment = await Appointment.findById(id);
    if (!appointment) return Response.json({ error: 'Not found' }, { status: 404 });

    if (!appointment.postVisitNotes) {
      return Response.json({ error: 'No clinical notes to summarize' }, { status: 400 });
    }

    const summary = await generatePostVisitSummary(appointment.postVisitNotes, appointment.prescription);
    if (summary) {
      appointment.postVisitSummary = summary;
      await appointment.save();
      return Response.json({ summary, message: 'AI summary regenerated!' });
    } else {
      return Response.json({ error: 'AI summary generation failed. Please try again.' }, { status: 503 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
