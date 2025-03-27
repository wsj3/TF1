// Import from treatment plans handler for shared access to data
import { v4 as uuidv4 } from 'uuid';

// Reference to in-memory treatment plans storage
// In a real app, this would use a database
let treatmentPlans = [];

// Get reference to the plans from the index handler's module
try {
  const plansModule = require('./index');
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
  
  // Check request method
  if (req.method === 'GET') {
    return getTreatmentPlan(req, res, id);
  } else if (req.method === 'PUT') {
    return updateTreatmentPlan(req, res, id);
  } else if (req.method === 'DELETE') {
    return deleteTreatmentPlan(req, res, id);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

/**
 * GET: Retrieve a specific treatment plan
 */
async function getTreatmentPlan(req, res, id) {
  try {
    // Find the treatment plan
    const plan = treatmentPlans.find(p => p.id === id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    return res.status(200).json(plan);
  } catch (error) {
    console.error(`Error fetching treatment plan ${id}:`, error);
    return res.status(500).json({ message: 'Failed to fetch treatment plan' });
  }
}

/**
 * PUT: Update a treatment plan
 */
async function updateTreatmentPlan(req, res, id) {
  try {
    // Find the plan index
    const planIndex = treatmentPlans.findIndex(p => p.id === id);
    
    if (planIndex === -1) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    const existingPlan = treatmentPlans[planIndex];
    const { title, status, goals, interventions, notes, progressHistory } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Create updated plan
    const updatedPlan = {
      ...existingPlan,
      title,
      status: status || existingPlan.status,
      goals: goals || existingPlan.goals,
      interventions: interventions || existingPlan.interventions,
      notes: notes || existingPlan.notes,
      progressHistory: progressHistory || existingPlan.progressHistory || [],
      updatedAt: new Date().toISOString()
    };
    
    // Update in-memory storage
    treatmentPlans[planIndex] = updatedPlan;
    
    return res.status(200).json(updatedPlan);
  } catch (error) {
    console.error(`Error updating treatment plan ${id}:`, error);
    return res.status(500).json({ message: 'Failed to update treatment plan' });
  }
}

/**
 * DELETE: Remove a treatment plan
 */
async function deleteTreatmentPlan(req, res, id) {
  try {
    // Find the plan index
    const planIndex = treatmentPlans.findIndex(p => p.id === id);
    
    if (planIndex === -1) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }
    
    // Remove from in-memory storage
    treatmentPlans.splice(planIndex, 1);
    
    return res.status(200).json({ message: 'Treatment plan deleted successfully' });
  } catch (error) {
    console.error(`Error deleting treatment plan ${id}:`, error);
    return res.status(500).json({ message: 'Failed to delete treatment plan' });
  }
} 