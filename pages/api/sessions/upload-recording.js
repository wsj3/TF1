import { verifySessionToken } from '../../../utils/security';
import { hasPermission } from '../../../utils/security';
import { validateHIPAACompliance } from '../../../utils/hipaaUtils';
import { prisma } from '../../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Verify authentication
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const userData = await verifySessionToken(token);
    
    // Check permissions
    if (!hasPermission(userData.role, 'manage_sessions')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    if (req.method === 'POST') {
      // Parse form data
      const form = formidable({
        uploadDir: path.join(process.cwd(), 'uploads', 'sessions'),
        keepExtensions: true,
        maxFileSize: 500 * 1024 * 1024, // 500MB limit
      });

      // Ensure upload directory exists
      if (!fs.existsSync(form.uploadDir)) {
        fs.mkdirSync(form.uploadDir, { recursive: true });
      }

      // Parse the incoming form data
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      // Validate required fields
      const { sessionId, clientId, therapistId } = fields;
      if (!sessionId || !clientId || !therapistId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(fields))) {
        return res.status(400).json({ 
          message: 'Request contains potentially sensitive information' 
        });
      }

      // Get the uploaded video file
      const videoFile = files.video?.[0];
      if (!videoFile) {
        return res.status(400).json({ message: 'No video file uploaded' });
      }

      // Generate unique filename
      const fileExtension = path.extname(videoFile.originalFilename);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const newPath = path.join(form.uploadDir, uniqueFilename);

      // Move file to permanent location
      fs.renameSync(videoFile.filepath, newPath);

      // Create recording record in database
      const recording = await prisma.sessionRecording.create({
        data: {
          sessionId,
          clientId,
          therapistId,
          filename: uniqueFilename,
          filepath: newPath,
          fileSize: videoFile.size,
          mimeType: videoFile.mimetype,
          duration: 0, // Will be updated after processing
          status: 'processing'
        }
      });

      // Start async processing of the recording
      processRecording(recording.id, newPath).catch(error => {
        console.error('Error processing recording:', error);
        prisma.sessionRecording.update({
          where: { id: recording.id },
          data: { status: 'error', error: error.message }
        });
      });

      return res.status(201).json({
        success: true,
        recording: {
          id: recording.id,
          status: recording.status
        }
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in upload-recording API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

// Async function to process the recording
async function processRecording(recordingId, filepath) {
  try {
    // Here you would:
    // 1. Generate video thumbnails
    // 2. Extract audio for transcription
    // 3. Process video for AI analysis
    // 4. Update recording metadata
    
    // For now, we'll just update the status
    await prisma.sessionRecording.update({
      where: { id: recordingId },
      data: { status: 'completed' }
    });
  } catch (error) {
    console.error('Error processing recording:', error);
    throw error;
  }
} 