/**
 * API Template for safe endpoints with Prisma error handling
 * Copy this file and modify it for new API endpoints
 */
import { createSafeApiEndpoint } from '../../utils/apiHelpers';

// Define the handler for your endpoint
async function endpointHandler(req, res, prisma) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return await getData(req, res, prisma);
    case 'POST':
      return await createData(req, res, prisma);
    case 'PUT':
      return await updateData(req, res, prisma);
    case 'DELETE':
      return await deleteData(req, res, prisma);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Implement your data retrieval logic
async function getData(req, res, prisma) {
  // Extract query parameters as needed
  const { id, search, limit = 10, offset = 0 } = req.query;
  
  try {
    // Your database query using prisma
    const data = await prisma.yourModelName.findMany({
      where: {
        // Your filter conditions
        ...(id && { id }),
        ...(search && { 
          OR: [
            { name: { contains: search } },
            { description: { contains: search } }
          ]
        })
      },
      include: {
        // Related models to include
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(offset),
      take: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: 'Data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getData:', error);
    throw error; // Let the wrapper handle the error
  }
}

// Define create logic
async function createData(req, res, prisma) {
  // Extract data from request body
  const { name, description, otherFields } = req.body;
  
  try {
    const newRecord = await prisma.yourModelName.create({
      data: {
        name,
        description,
        // Other fields
      }
    });
    
    return res.status(201).json({
      success: true,
      data: newRecord,
      message: 'Record created successfully'
    });
  } catch (error) {
    console.error('Error in createData:', error);
    throw error; // Let the wrapper handle the error
  }
}

// Define update logic
async function updateData(req, res, prisma) {
  const { id } = req.query;
  const { name, description, otherFields } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'ID is required for update' });
  }
  
  try {
    const updatedRecord = await prisma.yourModelName.update({
      where: { id },
      data: {
        name,
        description,
        // Other fields
      }
    });
    
    return res.status(200).json({
      success: true,
      data: updatedRecord,
      message: 'Record updated successfully'
    });
  } catch (error) {
    console.error('Error in updateData:', error);
    throw error; // Let the wrapper handle the error
  }
}

// Define delete logic
async function deleteData(req, res, prisma) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'ID is required for deletion' });
  }
  
  try {
    const deletedRecord = await prisma.yourModelName.delete({
      where: { id }
    });
    
    return res.status(200).json({
      success: true,
      data: deletedRecord,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteData:', error);
    throw error; // Let the wrapper handle the error
  }
}

// Function to generate demo data
function getDemoData() {
  const demoItems = [
    {
      id: 'demo-1',
      name: 'Demo Item 1',
      description: 'This is a demo item for testing',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'demo-2',
      name: 'Demo Item 2',
      description: 'Another demo item for testing',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date()
    },
    {
      id: 'demo-3',
      name: 'Demo Item 3',
      description: 'Yet another demo item',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      updatedAt: new Date()
    }
  ];
  
  return {
    success: true,
    data: demoItems,
    count: demoItems.length,
    message: 'Demo data retrieved successfully'
  };
}

// Export the wrapped endpoint handler
export default createSafeApiEndpoint(endpointHandler, getDemoData); 