/**
 * Clients API Example
 * 
 * This file demonstrates how to create API endpoints using Prisma client
 * for database operations related to clients.
 */

import prisma from './prismaClient';

/**
 * Get all clients for a therapist
 * @param {string} therapistId - The ID of the therapist
 * @returns {Promise<Array>} List of clients
 */
export async function getClientsByTherapist(therapistId) {
  try {
    const clients = await prisma.client.findMany({
      where: {
        therapistId: therapistId
      },
      orderBy: {
        lastName: 'asc'
      }
    });
    return clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
}

/**
 * Get client details including sessions, notes, and treatment plans
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} Client data with related information
 */
export async function getClientDetails(clientId) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        therapist: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sessions: {
          orderBy: {
            startTime: 'desc'
          },
          take: 5 // Get only the 5 most recent sessions
        },
        notes: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Get only the 10 most recent notes
        },
        treatmentPlans: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            goals: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });
    
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }
    
    return client;
  } catch (error) {
    console.error(`Error fetching client with ID ${clientId}:`, error);
    throw error;
  }
}

/**
 * Create a new client
 * @param {Object} data - Client data including therapistId
 * @returns {Promise<Object>} Created client
 */
export async function createClient(data) {
  try {
    const newClient = await prisma.client.create({
      data: data
    });
    return newClient;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

/**
 * Update client information
 * @param {string} clientId - Client ID
 * @param {Object} data - Updated client data
 * @returns {Promise<Object>} Updated client
 */
export async function updateClient(clientId, data) {
  try {
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: data
    });
    return updatedClient;
  } catch (error) {
    console.error(`Error updating client with ID ${clientId}:`, error);
    throw error;
  }
}

/**
 * Create a new session for a client
 * @param {Object} data - Session data
 * @returns {Promise<Object>} Created session
 */
export async function createSession(data) {
  try {
    const session = await prisma.session.create({
      data: data
    });
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get upcoming sessions for a therapist
 * @param {string} therapistId - Therapist ID
 * @returns {Promise<Array>} List of upcoming sessions
 */
export async function getUpcomingSessions(therapistId) {
  try {
    const now = new Date();
    
    const sessions = await prisma.session.findMany({
      where: {
        therapistId: therapistId,
        startTime: {
          gte: now
        },
        status: 'SCHEDULED'
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    return sessions;
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    throw error;
  }
}

/**
 * Add a note to a client
 * @param {Object} data - Note data
 * @returns {Promise<Object>} Created note
 */
export async function addClientNote(data) {
  try {
    const note = await prisma.note.create({
      data: data
    });
    return note;
  } catch (error) {
    console.error('Error adding client note:', error);
    throw error;
  }
}

/**
 * Create a treatment plan for a client
 * @param {Object} data - Treatment plan data with goals
 * @returns {Promise<Object>} Created treatment plan
 */
export async function createTreatmentPlan(data) {
  try {
    const { goals, ...planData } = data;
    
    // Create treatment plan with goals in a transaction
    const treatmentPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.create({
        data: {
          ...planData,
          goals: goals ? {
            create: goals
          } : undefined
        },
        include: {
          goals: true
        }
      });
      
      return plan;
    });
    
    return treatmentPlan;
  } catch (error) {
    console.error('Error creating treatment plan:', error);
    throw error;
  }
} 