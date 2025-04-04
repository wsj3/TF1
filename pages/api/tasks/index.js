import { createSafeApiEndpoint } from '../../../utils/apiHelpers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Handler for retrieving tasks
const getTasksHandler = async (req, res, prisma) => {
  console.log('Fetching tasks from database...');
  
  // Get user session for real data
  // const session = await getServerSession(req, res, authOptions);
  // if (!session) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }
  
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
    success: true,
    tasks,
    message: 'Tasks retrieved successfully',
    count: tasks.length
  });
};

// Handler for creating a task
const createTaskHandler = async (req, res, prisma) => {
  const { title, description, dueDate, clientId, goalId } = req.body;
  
  if (!title || !clientId) {
    return res.status(400).json({ 
      success: false,
      error: 'Title and client ID are required'
    });
  }
  
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
    success: true,
    task,
    message: 'Task created successfully'
  });
};

// Generate demo tasks if needed
const generateDemoTasks = () => {
  return {
    success: true,
    tasks: [
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
    ],
    message: 'Demo task data retrieved successfully',
    count: 3
  };
};

// Main API handler that routes to the appropriate handler based on HTTP method
const apiHandler = async (req, res, prisma) => {
  console.log('Tasks API called with method:', req.method);
  
  switch (req.method) {
    case 'GET':
      return await getTasksHandler(req, res, prisma);
    case 'POST':
      return await createTaskHandler(req, res, prisma);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ 
        success: false,
        error: `Method ${req.method} Not Allowed` 
      });
  }
};

// Export the handler wrapped with our safe API pattern
export default createSafeApiEndpoint(apiHandler, generateDemoTasks); 