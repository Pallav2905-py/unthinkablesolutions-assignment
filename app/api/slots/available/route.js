import { connectDB } from '../../../../lib/db.js';
import Doctor from '../../../../models/Doctor.js';
import Appointment from '../../../../models/Appointment.js';
import { addMinutes, format, parse, isAfter, isBefore, startOfDay } from 'date-fns';

// GET /api/slots/available?doctorId=&date=
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date'); // "2024-12-25"

    if (!doctorId || !date) {
      return Response.json({ error: 'doctorId and date are required' }, { status: 400 });
    }

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) return Response.json({ error: 'Doctor not found' }, { status: 404 });

    // Check if doctor is on leave
    if (doctor.leaveDays?.includes(date)) {
      return Response.json({ slots: [], message: 'Doctor is on leave for this date' });
    }

    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const workingHour = doctor.workingHours?.find(
      (wh) => wh.day === dayOfWeek && wh.isAvailable
    );

    if (!workingHour) {
      return Response.json({ slots: [], message: 'Doctor is not available on this day' });
    }

    // Generate all possible slots
    const slotDuration = doctor.slotDurationMinutes || 30;
    const allSlots = [];
    let current = parse(`${date} ${workingHour.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(`${date} ${workingHour.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, slotDuration);
      if (isAfter(slotEnd, end)) break;
      allSlots.push({
        startTime: format(current, 'HH:mm'),
        endTime: format(slotEnd, 'HH:mm'),
      });
      current = slotEnd;
    }

    // Get booked appointments for this date
    const booked = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['confirmed', 'pending'] },
    }).select('startTime endTime').lean();

    const bookedTimes = new Set(booked.map((a) => a.startTime));

    // Return slots with availability
    const slots = allSlots.map((slot) => ({
      ...slot,
      available: !bookedTimes.has(slot.startTime),
    }));

    return Response.json({ slots, date, doctorId });
  } catch (err) {
    console.error('[API/slots GET]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
