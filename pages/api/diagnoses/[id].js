import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;
  
  console.log(`API route /api/diagnoses/${id} called with method:`, req.method);
  
  try {
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await getDiagnosis(id, res);
      case 'PUT':
        return await updateDiagnosis(id, req, res);
      case 'DELETE':
        return await deleteDiagnosis(id, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(`Error in diagnosis API for ID ${id}:`, error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Get a single diagnosis by ID
async function getDiagnosis(id, res) {
  try {
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id },
      include: {
        Client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }
    
    return res.status(200).json({
      diagnosis,
      message: 'Diagnosis retrieved successfully'
    });
  } catch (error) {
    console.error(`Error fetching diagnosis ${id}:`, error);
    throw error;
  }
}

// Update a diagnosis
async function updateDiagnosis(id, req, res) {
  const { code, description, status, notes, name, diagnosisDate, dateAssigned } = req.body;
  
  console.log(`Updating diagnosis ${id} with data:`, req.body);
  
  try {
    // Check if diagnosis exists
    const existingDiagnosis = await prisma.diagnosis.findUnique({
      where: { id }
    });
    
    if (!existingDiagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }
    
    console.log('Existing diagnosis:', existingDiagnosis);
    
    // Determine which fields to use (handle both name/notes and diagnosisDate/dateAssigned)
    const notesValue = name !== undefined ? name : notes !== undefined ? notes : existingDiagnosis.name;
    const dateValue = dateAssigned ? new Date(dateAssigned) : diagnosisDate ? new Date(diagnosisDate) : existingDiagnosis.dateAssigned;
    
    console.log('Will update with notes:', notesValue);
    console.log('Will update with date:', dateValue);
    
    // Update the diagnosis
    const updatedDiagnosis = await prisma.diagnosis.update({
      where: { id },
      data: {
        code: code || existingDiagnosis.code,
        description: description !== undefined ? description : existingDiagnosis.description,
        status: status || existingDiagnosis.status,
        name: notesValue,
        dateAssigned: dateValue,
        updatedAt: new Date()
      },
      include: {
        Client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('Updated diagnosis:', updatedDiagnosis);
    
    return res.status(200).json({
      diagnosis: updatedDiagnosis,
      message: 'Diagnosis updated successfully'
    });
  } catch (error) {
    console.error(`Error updating diagnosis ${id}:`, error);
    throw error;
  }
}

// Delete a diagnosis
async function deleteDiagnosis(id, res) {
  try {
    // Check if diagnosis exists
    const existingDiagnosis = await prisma.diagnosis.findUnique({
      where: { id }
    });
    
    if (!existingDiagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }
    
    // Delete the diagnosis
    await prisma.diagnosis.delete({
      where: { id }
    });
    
    return res.status(200).json({
      message: 'Diagnosis deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting diagnosis ${id}:`, error);
    throw error;
  }
} 