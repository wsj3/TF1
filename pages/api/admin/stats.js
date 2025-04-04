import { withAuth } from '../../../utils/auth';
import prisma from '../../../lib/prisma';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Admin stats request from:', { 
      userId: req.user?.id,
      email: req.user?.email,
      isAdmin: req.user?.isAdmin 
    });

    // Verify admin status
    if (!req.user?.isAdmin) {
      console.log('Unauthorized access attempt:', { user: req.user });
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized - Admin access required',
        error: 'User does not have admin privileges'
      });
    }

    console.log('Fetching admin statistics...');

    // Get total users count
    const totalUsers = await prisma.user.count();
    console.log('Total users:', totalUsers);

    // Get active users count
    const activeUsers = await prisma.user.count({
      where: {
        status: 'active'
      }
    });
    console.log('Active users:', activeUsers);

    // Get pending approvals count
    const pendingApprovals = await prisma.user.count({
      where: {
        status: 'pending'
      }
    });
    console.log('Pending approvals:', pendingApprovals);

    // Get recent logins
    const recentLogins = await prisma.auditLog.findMany({
      where: {
        action: 'login'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Format recent logins for display
    const formattedLogins = recentLogins.map(log => ({
      userId: log.userId,
      action: log.action,
      time: log.createdAt.toISOString(),
      details: log.details
    }));

    console.log('Successfully fetched admin statistics');

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        pendingApprovals,
        recentLogins: formattedLogins
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
}

export default withAuth(handler); 