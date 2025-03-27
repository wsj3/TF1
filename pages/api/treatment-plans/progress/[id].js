import { v4 as uuidv4 } from 'uuid';

// Reference to in-memory treatment plans storage
// In a real app, this would use a database
let treatmentPlans = [];

// Get reference to the plans from the index handler's module
try {
  const plansModule = require('../index');
  treatmentPlans = plansModule.default.treatmentPlans || [];
} catch (error) {
  console.error('Could not access treatment plans from index handler', error);
  // We'll use the empty array as fallback
}

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Treatment plan ID is required' });
  }
  
  // Only allow POST for progress updates
  if (req.method === 'POST') {
    return updateProgress(req, res, id);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

/**
 * POST: Update progress for a treatment plan
 */
async function updateProgress(req, res, id) {
  try {
    // Find the plan
    const planIndex = treatmentPlans.findIndex(p => p.id === id);
    
    if (planIndex === -1) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    const existingPlan = treatmentPlans[planIndex];
    const { goals, notes } = req.body;
    
    // Create progress entry
    const progressEntry = {
      date: new Date().toISOString(),
      notes: notes || ''
    };
    
    // Create updated plan
    const updatedPlan = {
      ...existingPlan,
      goals: goals || existingPlan.goals,
      progressHistory: [...(existingPlan.progressHistory || []), progressEntry],
      updatedAt: new Date().toISOString()
    };
    
    // Update in-memory storage
    treatmentPlans[planIndex] = updatedPlan;
    
    // Also create a progress note if there's content
    if (notes && notes.trim()) {
      try {
        // Extract active goals for linking
        const linkedGoals = (updatedPlan.goals || [])
          .filter(goal => goal.status === 'active' || goal.status === 'achieved')
          .map(goal => ({ id: goal.id, description: goal.description }));
        
        // Create progress note
        const progressNote = {
          id: `note-${uuidv4()}`,
          clientId: updatedPlan.clientId,
          treatmentPlanId: id,
          date: new Date().toISOString(),
          content: notes,
          linkedGoals
        };
        
        // In a real app, this would save to a database
        // For now, we'll just log it
        console.log('Created progress note:', progressNote);
      } catch (error) {
        console.error('Error creating progress note:', error);
        // Don't fail the whole operation if just the note creation fails
      }
    }
    
    return res.status(200).json({
      success: true,
      plan: updatedPlan
    });
  } catch (error) {
    console.error(`Error updating progress for plan ${id}:`, error);
    return res.status(500).json({ message: 'Failed to update progress' });
  }
} 