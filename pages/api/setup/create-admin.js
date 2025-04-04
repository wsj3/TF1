import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test database connection first
    console.log('Testing database connection...');
    try {
      // Try a simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection test failed:', {
        error: dbError,
        url: process.env.DATABASE_URL ? 'URL exists' : 'URL missing',
        env: process.env.NODE_ENV
      });
      return res.status(500).json({ 
        message: 'Database connection failed. Please check your database configuration.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    console.log('Starting admin user creation process');

    const { email, password, name } = req.body;
    console.log('Received request data:', { email, name });

    // Validate input
    if (!email || !password || !name) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    // Check if any user exists (first user should be admin)
    console.log('Checking for existing users...');
    const userCount = await prisma.user.count();
    console.log('Current user count:', userCount);

    if (userCount > 0) {
      const existingAdmin = await prisma.user.findFirst({
        where: { isAdmin: true }
      });

      if (existingAdmin) {
        console.log('Admin already exists');
        return res.status(400).json({ message: 'Admin user already exists' });
      }
    }

    // Check if email is already in use
    console.log('Checking if email is in use:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Email already in use');
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Create admin user
    const userData = {
      email,
      name,
      password: hashedPassword,
      role: 'THERAPIST',
      status: 'active',
      isAdmin: true
    };

    console.log('Attempting to create user with data:', { ...userData, password: '[REDACTED]' });

    const admin = await prisma.user.create({
      data: userData
    });

    console.log('Admin user created successfully:', admin.id);

    // Create audit log
    const auditLogData = {
      userId: admin.id,
      action: 'create_admin',
      details: `Initial admin user created: ${email}`
    };

    console.log('Creating audit log:', auditLogData);

    await prisma.auditLog.create({
      data: auditLogData
    });

    console.log('Audit log created successfully');

    // Remove sensitive data before sending response
    const { password: _, ...adminData } = admin;

    return res.status(201).json({
      message: 'Admin user created successfully',
      user: adminData
    });

  } catch (error) {
    console.error('Detailed error creating admin:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    
    // Check if this is a Prisma error
    if (error?.name === 'PrismaClientKnownRequestError') {
      return res.status(500).json({ 
        message: 'Database operation failed',
        error: process.env.NODE_ENV === 'development' 
          ? `${error.message} (Code: ${error.code})` 
          : 'Database operation failed'
      });
    }
    
    return res.status(500).json({ 
      message: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${error.message}` 
        : 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 