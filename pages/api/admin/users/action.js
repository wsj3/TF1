import { withAuth } from '../../../../utils/auth';
import prisma from '../../../../lib/prisma';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify admin status
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Prevent self-modification
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({ message: 'Cannot modify your own account' });
    }

    let updateData = {};
    let actionDescription = '';

    switch (action) {
      case 'activate':
        updateData = { status: 'active' };
        actionDescription = 'activated';
        break;
      case 'deactivate':
        updateData = { status: 'inactive' };
        actionDescription = 'deactivated';
        break;
      case 'delete':
        // Soft delete users
        updateData = { status: 'deleted', deletedAt: new Date() };
        actionDescription = 'deleted';
        break;
      case 'approve':
        updateData = { status: 'active' };
        actionDescription = 'approved';
        break;
      case 'reject':
        updateData = { status: 'rejected' };
        actionDescription = 'rejected';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    // Update users
    await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: updateData
    });

    // Log the action for each user
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        email: true
      }
    });

    await Promise.all(users.map(user => 
      prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: `user_${action}`,
          details: `${actionDescription} user ${user.email}`
        }
      })
    ));

    return res.status(200).json({ 
      message: `Successfully ${actionDescription} ${users.length} user(s)`,
      affected: users.length
    });

  } catch (error) {
    console.error('User action error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withAuth(handler); 