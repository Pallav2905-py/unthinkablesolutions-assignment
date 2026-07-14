import { connectDB } from '../../../lib/db.js';
import Appointment from '../../../models/Appointment.js';
import Doctor from '../../../models/Doctor.js';
import Slot from '../../../models/Slot.js';
import User from '../../../models/User.js';
import { auth } from '../../../lib/auth.js';
import { headers } from 'next/headers';
import { generatePreVisitSummary } from '../../../lib/groq.js';
import { sendBookingConfirmation } from '../../../lib/email.js';

// GET /api/appointments — get appointments for current user
export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query = {};
    if (session.user.role === 'patient') query.patientId = session.user.id;
    else if (session.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: session.user.id });
      if (!doctor) return Response.json({ appointments: [] });
      query.doctorId = doctor._id;
    }
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email avatar phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email avatar' } })
      .sort({ date: -1, startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Appointment.countDocuments(query);
    return Response.json({ appointments, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[API/appointments GET]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/appointments — patient books an appointment
export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'patient') {
      return Response.json({ error: 'Only patients can book appointments' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { doctorId, date, startTime, endTime, slotId, symptoms } = body;

    if (!doctorId || !date || !startTime || !endTime) {
      return Response.json({ error: 'Missing required booking details' }, { status: 400 });
    }

    // Verify slot hold (if slotId provided)
    if (slotId) {
      const slot = await Slot.findOne({
        _id: slotId,
        doctorId,
        date,
        startTime,
        heldBy: session.user.id,
        isBooked: false,
        heldUntil: { $gt: new Date() },
      });
      if (!slot) {
        return Response.json({ error: 'Slot hold expired or invalid. Please select the slot again.' }, { status: 409 });
      }
    }

    // Double-check: no conflicting appointment (double-booking prevention)
    const existing = await Appointment.findOne({
      doctorId,
      date,
      startTime,
      status: { $in: ['confirmed', 'pending'] },
    });
    if (existing) {
      return Response.json({ error: 'This slot was just booked by another patient. Please select a different time.' }, { status: 409 });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: session.user.id,
      doctorId,
      date,
      startTime,
      endTime,
      status: 'confirmed',
      symptoms: symptoms
        ? {
            text: symptoms.text,
            selfAssessedUrgency: symptoms.urgency || 'Medium',
            duration: symptoms.duration,
            additionalNotes: symptoms.additionalNotes,
          }
        : undefined,
    });

    // Mark slot as booked
    if (slotId) {
      await Slot.findByIdAndUpdate(slotId, { isBooked: true, appointmentId: appointment._id, heldUntil: null });
    }

    // Generate pre-visit AI summary (non-blocking)
    if (symptoms?.text) {
      generatePreVisitSummary(symptoms.text)
        .then(async (summary) => {
          if (summary) {
            await Appointment.findByIdAndUpdate(appointment._id, {
              preVisitSummary: {
                urgencyLevel: summary.urgencyLevel,
                chiefComplaint: summary.chiefComplaint,
                suggestedQuestions: summary.suggestedQuestions,
                failed: false,
                generatedAt: new Date(),
              },
            });
          } else {
            await Appointment.findByIdAndUpdate(appointment._id, {
              preVisitSummary: { failed: true, generatedAt: new Date() },
            });
          }
        })
        .catch(console.error);
    }

    // Send confirmation emails (non-blocking)
    const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
    const patient = await User.findById(session.user.id);

    if (doctor && patient) {
      sendBookingConfirmation({
        patientEmail: patient.email,
        patientName: patient.name,
        doctorEmail: doctor.userId?.email,
        doctorName: doctor.userId?.name,
        appointment: {
          ...appointment.toObject(),
          specialisation: doctor.specialisation,
        },
      }).catch(console.error);
    }

    return Response.json({ appointment, message: 'Appointment booked successfully!' }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return Response.json({ error: 'This slot was just booked. Please choose a different time.' }, { status: 409 });
    }
    console.error('[API/appointments POST]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
