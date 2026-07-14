import { connectDB } from '../../../../lib/db.js';
import User from '../../../../models/User.js';
import Doctor from '../../../../models/Doctor.js';
import Appointment from '../../../../models/Appointment.js';
import { auth } from '../../../../lib/auth.js';
import { headers } from 'next/headers';

// GET /api/admin/stats — dashboard analytics
export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ isActive: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
    ]);

    // Last 7 days bookings
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAppointments = await Appointment.aggregate([
      { $match: { bookedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Specialisation distribution
    const specialisationStats = await Doctor.aggregate([
      { $group: { _id: '$specialisation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    return Response.json({
      stats: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
      },
      recentAppointments,
      specialisationStats,
    });
  } catch (err) {
    console.error('[API/admin/stats]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
