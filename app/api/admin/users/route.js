import { connectDB } from '../../../../lib/db.js';
import User from '../../../../models/User.js';
import { auth } from '../../../../lib/auth.js';
import { headers } from 'next/headers';

// GET /api/admin/users — list all users
export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const query = role ? { role } : {};
    const users = await User.find(query).select('-googleTokens').sort({ createdAt: -1 }).lean();
    return Response.json({ users });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
