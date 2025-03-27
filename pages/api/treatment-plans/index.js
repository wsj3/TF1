import { v4 as uuidv4 } from 'uuid';
import { getClientById } from '../../../utils/clientUtils';

// In-memory storage for development/demo purposes
// In a real app, this would use a database
let treatmentPlans = [];

// Demo data
const demoPlans = [
  {
    id: 'plan-1',
    clientId: 'demo-1',
    clientName: 'Jane Smith',
    title: 'Anxiety Management Plan',
    status: 'active',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    goals: [
      {
        id: 'goal-1',
        description: 'Reduce anxiety symptoms in social situations',
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
        status: 'active',
        objectives: [
          {
            id: 'obj-1-1',
            description: 'Practice deep breathing techniques when feeling anxious',
            measurable: 'Daily for 10 minutes',
            status: 'in-progress'
          },
          {
            id: 'obj-1-2',
            description: 'Attend group social events at least once per week',
            measurable: 'Weekly attendance with anxiety level below 5/10',
            status: 'pending'
          }
        ]
      },
      {
        id: 'goal-2',
        description: 'Develop healthy coping mechanisms for stress management',
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0],
        status: 'active',
        objectives: [
          {
            id: 'obj-2-1',
            description: 'Identify 3 new stress management techniques',
            measurable: 'List of techniques with effectiveness rating',
            status: 'completed'
          }
        ]
      }
    ],
    interventions: [
      {
        id: 'int-1',
        description: 'Cognitive Behavioral Therapy (CBT) focusing on thought restructuring',
        evidence: 'Multiple meta-analyses showing effectiveness for anxiety disorders',
        source: 'Beck Institute'
      },
      {
        id: 'int-2',
        description: 'Mindfulness-Based Stress Reduction',
        evidence: 'Research indicates effectiveness for reducing anxiety and stress',
        source: 'AI Suggestion'
      }
    ],
    notes: 'Client has shown good progress with breathing techniques but struggles with consistency. Consider incorporating reminders via app.'
  },
  {
    id: 'plan-2',
    clientId: 'demo-2',
    clientName: 'Michael Johnson',
    title: 'Depression Recovery Plan',
    status: 'draft',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    goals: [
      {
        id: 'goal-1',
        description: 'Improve daily activity level and reduce social isolation',
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0],
        status: 'active',
        objectives: [
          {
            id: 'obj-1-1',
            description: 'Schedule and engage in at least one social activity per week',
            measurable: 'Weekly social engagement logged in journal',
            status: 'pending'
          }
        ]
      }
    ],
    interventions: [],
    notes: 'Initial assessment complete. Plan is in draft form pending client review.'
  }
];

// Initialize with demo data
treatmentPlans = [...demoPlans];

export default async function handler(req, res) {
  // Check request method
  if (req.method === 'GET') {
    return getTreatmentPlans(req, res);
  } else if (req.method === 'POST') {
    return createTreatmentPlan(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

/**
 * GET: Retrieve treatment plans
 */
async function getTreatmentPlans(req, res) {
  try {
    // Get query parameters for filtering
    const { clientId, status } = req.query;
    
    // Apply filters if they exist
    let filteredPlans = [...treatmentPlans];
    
    if (clientId) {
      filteredPlans = filteredPlans.filter(plan => plan.clientId === clientId);
    }
    
    if (status && status !== 'all') {
      filteredPlans = filteredPlans.filter(plan => plan.status === status);
    }
    
    // Sort by creation date (most recent first)
    filteredPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return res.status(200).json(filteredPlans);
  } catch (error) {
    console.error('Error fetching treatment plans:', error);
    return res.status(500).json({ message: 'Failed to fetch treatment plans' });
  }
}

/**
 * POST: Create a new treatment plan
 */
async function createTreatmentPlan(req, res) {
  try {
    const { clientId, title, status, goals, interventions, notes } = req.body;
    
    // Validate required fields
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Check if client exists
    const client = getClientById(clientId);
    if (!client) {
      // For demo clients, we'll create a mock client
      if (clientId.startsWith('demo-')) {
        const demoClientNames = {
          'demo-1': 'Jane Smith',
          'demo-2': 'Michael Johnson',
          'demo-3': 'Sarah Williams',
          'demo-4': 'John Doe',
          'demo-5': 'Emily Davis'
        };
        
        // Create a new treatment plan
        const newPlan = {
          id: `plan-${uuidv4()}`,
          clientId,
          clientName: demoClientNames[clientId] || 'Demo Client',
          title,
          status: status || 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          goals: goals || [],
          interventions: interventions || [],
          notes: notes || ''
        };
        
        // Add to in-memory storage
        treatmentPlans.push(newPlan);
        
        return res.status(201).json(newPlan);
      } else {
        return res.status(400).json({ message: 'Client not found' });
      }
    } else {
      // Create a new treatment plan for a real client
      const newPlan = {
        id: `plan-${uuidv4()}`,
        clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        title,
        status: status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        goals: goals || [],
        interventions: interventions || [],
        notes: notes || ''
      };
      
      // Add to in-memory storage
      treatmentPlans.push(newPlan);
      
      return res.status(201).json(newPlan);
    }
  } catch (error) {
    console.error('Error creating treatment plan:', error);
    return res.status(500).json({ message: 'Failed to create treatment plan' });
  }
} 