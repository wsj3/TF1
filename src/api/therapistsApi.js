/**
 * Therapists API Example
 * 
 * This file demonstrates how to create API endpoints using Prisma client
 * for database operations related to therapists.
 */

import prisma from './prismaClient';

/**
 * Get all therapists with their profiles
 * @returns {Promise<Array>} List of therapists
 */
export async function getAllTherapists() {
  try {
    const therapists = await prisma.user.findMany({
      where: {
        role: 'THERAPIST'
      },
      include: {
        profile: true
      }
    });
    return therapists;
  } catch (error) {
    console.error('Error fetching therapists:', error);
    throw error;
  }
}

/**
 * Get therapist by ID with profile and clients
 * @param {string} id - Therapist ID
 * @returns {Promise<Object>} Therapist data with profile and clients
 */
export async function getTherapistById(id) {
  try {
    const therapist = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        clients: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        }
      }
    });
    
    if (!therapist) {
      throw new Error(`Therapist with ID ${id} not found`);
    }
    
    return therapist;
  } catch (error) {
    console.error(`Error fetching therapist with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new therapist
 * @param {Object} data - Therapist data
 * @returns {Promise<Object>} Created therapist
 */
export async function createTherapist(data) {
  try {
    const { email, name, password, profile } = data;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error(`User with email ${email} already exists`);
    }
    
    // Create therapist with profile in a transaction
    const therapist = await prisma.$transaction(async (tx) => {
      // In a real app, hash the password before storing
      const user = await tx.user.create({
        data: {
          email,
          name,
          password, // Should be hashed in production
          role: 'THERAPIST',
          profile: profile ? {
            create: profile
          } : undefined
        },
        include: {
          profile: true
        }
      });
      
      return user;
    });
    
    return therapist;
  } catch (error) {
    console.error('Error creating therapist:', error);
    throw error;
  }
}

/**
 * Update therapist information
 * @param {string} id - Therapist ID
 * @param {Object} data - Updated therapist data
 * @returns {Promise<Object>} Updated therapist
 */
export async function updateTherapist(id, data) {
  try {
    const { email, name, profile } = data;
    
    // If email is changed, check if new email exists
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id
          }
        }
      });
      
      if (existingUser) {
        throw new Error(`User with email ${email} already exists`);
      }
    }
    
    // Update therapist and profile in a transaction
    const updatedTherapist = await prisma.$transaction(async (tx) => {
      let userUpdateData = {};
      if (email) userUpdateData.email = email;
      if (name) userUpdateData.name = name;
      
      const user = await tx.user.update({
        where: { id },
        data: userUpdateData,
        include: {
          profile: true
        }
      });
      
      // Update profile if provided
      if (profile && Object.keys(profile).length > 0 && user.profile) {
        await tx.profile.update({
          where: { userId: id },
          data: profile
        });
      } else if (profile && Object.keys(profile).length > 0 && !user.profile) {
        // Create profile if it doesn't exist
        await tx.profile.create({
          data: {
            ...profile,
            userId: id
          }
        });
      }
      
      // Get updated user with profile
      return await tx.user.findUnique({
        where: { id },
        include: {
          profile: true
        }
      });
    });
    
    return updatedTherapist;
  } catch (error) {
    console.error(`Error updating therapist with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a therapist and associated data
 * @param {string} id - Therapist ID
 * @returns {Promise<Object>} Deleted therapist
 */
export async function deleteTherapist(id) {
  try {
    // Delete therapist (Prisma will handle cascading deletions based on your schema)
    const deletedTherapist = await prisma.user.delete({
      where: { id }
    });
    
    return deletedTherapist;
  } catch (error) {
    console.error(`Error deleting therapist with ID ${id}:`, error);
    throw error;
  }
} 