import { connectDB } from '../../../../lib/db.js';
import Doctor from '../../../../models/Doctor.js';
import User from '../../../../models/User.js';
import Appointment from '../../../../models/Appointment.js';
import { auth } from '../../../../lib/auth.js';
import { headers } from 'next/headers';
import { sendCancellationNotification } from '../../../../lib/email.js';

// GET /api/doctors/[id]
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const doctor = await Doctor.findById(id).populate('userId', 'name email avatar phone').lean();
    if (!doctor) return Response.json({ error: 'Doctor not found' }, { status: 404 });
    return Response.json({ doctor });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/doctors/[id] — admin updates doctor profile
export async function PUT(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { leaveDays, ...rest } = body;

    const doctor = await Doctor.findById(id).populate('userId');
    if (!doctor) return Response.json({ error: 'Doctor not found' }, { status: 404 });

    // Handle leave days with conflict resolution
    if (leaveDays !== undefined) {
      const previousLeaveDays = doctor.leaveDays || [];
      const newLeaveDays = leaveDays;
      const addedLeaveDays = newLeaveDays.filter((d) => !previousLeaveDays.includes(d));

      // Find and cancel conflicting appointments
      if (addedLeaveDays.length > 0) {
        const conflicting = await Appointment.find({
          doctorId: id,
          date: { $in: addedLeaveDays },
          status: { $in: ['confirmed', 'pending'] },
        }).populate('patientId');

        for (const appt of conflicting) {
          appt.status = 'cancelled';
          appt.cancellationReason = 'Doctor is on leave for this date';
          await appt.save();

          // Send cancellation notifications
          try {
            await sendCancellationNotification({
              patientEmail: appt.patientId?.email,
              patientName: appt.patientId?.name,
              doctorEmail: doctor.userId?.email,
              doctorName: doctor.userId?.name,
              appointment: appt,
              reason: 'Doctor is on scheduled leave for this date. Please rebook at your convenience.',
            });
          } catch (emailErr) {
            console.error('[Doctor Leave] Email notification failed:', emailErr.message);
          }
        }

        console.log(`[Doctor Leave] Cancelled ${conflicting.length} conflicting appointments for leave days:`, addedLeaveDays);
      }
      rest.leaveDays = newLeaveDays;
    }

    const updated = await Doctor.findByIdAndUpdate(id, rest, { new: true }).populate('userId', 'name email avatar');
    return Response.json({ doctor: updated });
  } catch (err) {
    console.error('[API/doctors PUT]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/doctors/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    await Doctor.findByIdAndUpdate(id, { isActive: false });
    return Response.json({ message: 'Doctor deactivated' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
