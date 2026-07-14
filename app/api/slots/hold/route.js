import { connectDB } from '../../../../lib/db.js';
import Slot from '../../../../models/Slot.js';
import Appointment from '../../../../models/Appointment.js';
import { auth } from '../../../../lib/auth.js';
import { headers } from 'next/headers';

// POST /api/slots/hold — atomically hold a slot for 5 minutes
export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { doctorId, date, startTime, endTime } = await request.json();

    if (!doctorId || !date || !startTime || !endTime) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First check if already booked
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      startTime,
      status: { $in: ['confirmed', 'pending'] },
    });
    if (existingAppointment) {
      return Response.json({ error: 'Slot already booked' }, { status: 409 });
    }

    const heldUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Atomic upsert — only wins if slot is not held by someone else
    const slot = await Slot.findOneAndUpdate(
      {
        doctorId,
        date,
        startTime,
        isBooked: false,
        $or: [{ heldBy: null }, { heldUntil: { $lt: new Date() } }],
      },
      {
        $set: {
          endTime,
          heldBy: session.user.id,
          heldUntil,
        },
      },
      { upsert: true, new: true }
    );

    if (!slot) {
      return Response.json({ error: 'Slot is currently held by another user. Please try a different slot.' }, { status: 409 });
    }

    return Response.json({
      slotId: slot._id,
      heldUntil: slot.heldUntil,
      message: 'Slot held for 5 minutes. Complete booking before expiry.',
    });
  } catch (err) {
    if (err.code === 11000) {
      return Response.json({ error: 'Slot is no longer available' }, { status: 409 });
    }
    console.error('[API/slots/hold]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
