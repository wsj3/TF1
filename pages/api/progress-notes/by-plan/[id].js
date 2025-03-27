import { v4 as uuidv4 } from 'uuid';

// Reference to progress notes storage
let progressNotes = [];

// Get reference to progress notes from the index handler's module
try {
  const notesModule = require('../index');
  progressNotes = notesModule.default.progressNotes || [];
} catch (error) {
  console.error('Could not access progress notes from index handler', error);
  // We'll use the empty array as fallback
}

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Treatment plan ID is required' });
  }
  
  // Only allow GET for retrieving notes
  if (req.method === 'GET') {
    return getProgressNotesByPlan(req, res, id);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

/**
 * GET: Retrieve progress notes for a specific treatment plan
 */
async function getProgressNotesByPlan(req, res, id) {
  try {
    // Find notes linked to this treatment plan
    const notes = progressNotes.filter(note => note.treatmentPlanId === id);
    
    // Sort by date (most recent first)
    notes.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return res.status(200).json(notes);
  } catch (error) {
    console.error(`Error fetching progress notes for treatment plan ${id}:`, error);
    return res.status(500).json({ message: 'Failed to fetch progress notes' });
  }
} 