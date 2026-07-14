import { connectDB } from '../../../lib/db.js';
import Doctor from '../../../models/Doctor.js';
import User from '../../../models/User.js';
import { auth } from '../../../lib/auth.js';
import { headers } from 'next/headers';

// GET /api/doctors — list all doctors with filters
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const specialisation = searchParams.get('specialisation');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const query = { isActive: true };
    if (specialisation) query.specialisation = { $regex: specialisation, $options: 'i' };

    let doctors = await Doctor.find(query)
      .populate('userId', 'name email avatar phone')
      .sort({ rating: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (search) {
      doctors = doctors.filter(
        (d) =>
          d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          d.specialisation?.toLowerCase().includes(search.toLowerCase()) ||
          d.bio?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Doctor.countDocuments(query);

    return Response.json({ doctors, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[API/doctors GET]', err);
    return Response.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}

// POST /api/doctors — admin creates a doctor profile
export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { userId, specialisation, bio, experience, qualifications, workingHours, slotDurationMinutes, consultationFee } = body;

    if (!userId || !specialisation) {
      return Response.json({ error: 'userId and specialisation are required' }, { status: 400 });
    }

    // Update user role to doctor
    await User.findByIdAndUpdate(userId, { role: 'doctor' });

    const doctor = await Doctor.create({
      userId,
      specialisation,
      bio,
      experience: experience || 0,
      qualifications: qualifications || [],
      workingHours: workingHours || [],
      slotDurationMinutes: slotDurationMinutes || 30,
      consultationFee: consultationFee || 500,
    });

    const populated = await doctor.populate('userId', 'name email avatar');
    return Response.json({ doctor: populated }, { status: 201 });
  } catch (err) {
    console.error('[API/doctors POST]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
