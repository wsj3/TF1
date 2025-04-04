import { withAuth } from '../../../../utils/auth';
import prisma from '../../../../lib/prisma';

async function handler(req, res) {
  // Verify admin status
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { 
        search, 
        status, 
        role,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = req.query;

      // Build where clause based on filters
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (status) where.status = status;
      if (role) where.role = role;

      // Get total count for pagination
      const total = await prisma.user.count({ where });

      // Get users with pagination and sorting
      const users = await prisma.user.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: true,
          createdAt: true,
          lastLogin: true
        }
      });

      return res.status(200).json({
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { email, name, role, status = 'pending' } = req.body;

      // Validate required fields
      if (!email || !name) {
        return res.status(400).json({ message: 'Email and name are required' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: role || 'user',
          status
        }
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'create_user',
          details: `Created user ${email}`
        }
      });

      return res.status(201).json(user);

    } catch (error) {
      console.error('Create user error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler); 