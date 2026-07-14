import { connectDB } from '../../../../lib/db.js';
import Appointment from '../../../../models/Appointment.js';
import Doctor from '../../../../models/Doctor.js';
import { auth } from '../../../../lib/auth.js';
import { headers } from 'next/headers';
import { sendCancellationNotification } from '../../../../lib/email.js';

// GET /api/appointments/[id]
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email avatar phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email avatar' } })
      .lean();

    if (!appointment) return Response.json({ error: 'Appointment not found' }, { status: 404 });

    // Authorization check
    const isPatient = appointment.patientId?._id?.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    let isDoctor = false;
    if (session.user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: session.user.id });
      isDoctor = doc?._id?.toString() === appointment.doctorId?._id?.toString();
    }

    if (!isPatient && !isDoctor && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return Response.json({ appointment });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/appointments/[id] — cancel or reschedule
export async function PUT(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, cancellationReason } = body;

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    if (!appointment) return Response.json({ error: 'Not found' }, { status: 404 });

    if (status === 'cancelled') {
      appointment.status = 'cancelled';
      appointment.cancellationReason = cancellationReason || 'Cancelled by user';
      await appointment.save();

      // Send cancellation notifications
      sendCancellationNotification({
        patientEmail: appointment.patientId?.email,
        patientName: appointment.patientId?.name,
        doctorEmail: appointment.doctorId?.userId?.email,
        doctorName: appointment.doctorId?.userId?.name,
        appointment,
        reason: appointment.cancellationReason,
      }).catch(console.error);
    } else {
      Object.assign(appointment, body);
      await appointment.save();
    }

    return Response.json({ appointment });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
