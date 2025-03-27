import { v4 as uuidv4 } from 'uuid';
import { getClientById } from '../../../utils/clientUtils';

// In-memory storage for development/demo purposes
let progressNotes = [];

// Demo data
const demoProgressNotes = [
  {
    id: 'note-1',
    clientId: 'demo-1',
    treatmentPlanId: 'plan-1',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    content: 'Client practiced deep breathing exercises daily this week. Reports lower anxiety levels during social events. Will continue with exposure exercises.',
    linkedGoals: [
      { id: 'goal-1', description: 'Reduce anxiety symptoms in social situations' }
    ]
  },
  {
    id: 'note-2',
    clientId: 'demo-1',
    treatmentPlanId: 'plan-1',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    content: 'Client identified three effective coping strategies for stress management. Has been implementing mindfulness exercises with good results.',
    linkedGoals: [
      { id: 'goal-2', description: 'Develop healthy coping mechanisms for stress management' }
    ]
  }
];

// Initialize with demo data
progressNotes = [...demoProgressNotes];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getProgressNotes(req, res);
  } else if (req.method === 'POST') {
    return createProgressNote(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

/**
 * GET: Retrieve progress notes
 */
async function getProgressNotes(req, res) {
  try {
    const { clientId, treatmentPlanId } = req.query;
    
    let filteredNotes = [...progressNotes];
    
    // Apply filters
    if (clientId) {
      filteredNotes = filteredNotes.filter(note => note.clientId === clientId);
    }
    
    if (treatmentPlanId) {
      filteredNotes = filteredNotes.filter(note => note.treatmentPlanId === treatmentPlanId);
    }
    
    // Sort by date (most recent first)
    filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return res.status(200).json(filteredNotes);
  } catch (error) {
    console.error('Error fetching progress notes:', error);
    return res.status(500).json({ message: 'Failed to fetch progress notes' });
  }
}

/**
 * POST: Create a new progress note
 */
async function createProgressNote(req, res) {
  try {
    const { clientId, treatmentPlanId, content, date, linkedGoals } = req.body;
    
    // Validate required fields
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }
    
    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    // Create the new progress note
    const newNote = {
      id: `note-${uuidv4()}`,
      clientId,
      treatmentPlanId: treatmentPlanId || null,
      date: date || new Date().toISOString(),
      content,
      linkedGoals: linkedGoals || []
    };
    
    // Add to storage
    progressNotes.push(newNote);
    
    return res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating progress note:', error);
    return res.status(500).json({ message: 'Failed to create progress note' });
  }
} 