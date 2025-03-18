import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Add error handling and logging to diagnose issues
  console.log('API route /api/tasks called with method:', req.method);
  
  try {
    // For debugging
    const demoMode = req.query.demo === 'true';
    
    // Log environment variables to help debug
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await getTasks(req, res, demoMode);
      case 'POST':
        return await createTask(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error in tasks API:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Get all tasks
async function getTasks(req, res, demoMode) {
  try {
    // Return demo data if in demo mode
    if (demoMode) {
      console.log('Returning demo task data');
      return res.status(200).json({
        tasks: generateDemoTasks(),
        message: 'Demo task data retrieved successfully',
        demoMode: true
      });
    }
    
    // Get user session for real data
    // const session = await getServerSession(req, res, authOptions);
    // if (!session) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    
    // For now, skip auth to check if the API works
    console.log('Fetching tasks from database...');
    
    const tasks = await prisma.task.findMany({
      include: {
        Client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        Goal: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    
    console.log(`Found ${tasks.length} tasks in the database`);
    
    return res.status(200).json({
      tasks,
      message: 'Tasks retrieved successfully',
      count: tasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

// Create a new task
async function createTask(req, res) {
  const { title, description, dueDate, clientId, goalId } = req.body;
  
  if (!title || !clientId) {
    return res.status(400).json({ error: 'Title and client ID are required' });
  }
  
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId,
        goalId,
        status: 'PENDING',
        updatedAt: new Date()
      }
    });
    
    return res.status(201).json({
      task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

// Generate demo tasks if needed
function generateDemoTasks() {
  return [
    {
      id: 'demo-task-1',
      title: 'Complete therapy homework',
      description: 'Finish the CBT worksheets from last session',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      status: 'PENDING',
      Client: {
        id: 'client-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.j@example.com'
      },
      Goal: {
        id: 'goal-1',
        description: 'Reduce anxiety symptoms',
        status: 'IN_PROGRESS'
      }
    },
    {
      id: 'demo-task-2',
      title: 'Daily meditation practice',
      description: '10 minutes of mindfulness meditation each morning',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      status: 'IN_PROGRESS',
      Client: {
        id: 'client-2',
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'mwilliams@example.com'
      },
      Goal: null
    },
    {
      id: 'demo-task-3',
      title: 'Schedule follow-up appointment',
      description: 'Call clinic to schedule next month\'s appointment',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      status: 'PENDING',
      Client: {
        id: 'client-3',
        firstName: 'Emily',
        lastName: 'Brown',
        email: 'emily.b@example.com'
      },
      Goal: null
    }
  ];
} 