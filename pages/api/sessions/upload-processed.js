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
        uploadDir: path.join(process.cwd(), 'uploads', 'processed'),
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

      // Get the uploaded files
      const videoFile = files.video?.[0];
      const thumbnailFile = files.thumbnail?.[0];
      const audioFile = files.audio?.[0];

      if (!videoFile || !thumbnailFile || !audioFile) {
        return res.status(400).json({ message: 'Missing required files' });
      }

      // Generate unique filenames
      const videoFilename = `${uuidv4()}${path.extname(videoFile.originalFilename)}`;
      const thumbnailFilename = `${uuidv4()}${path.extname(thumbnailFile.originalFilename)}`;
      const audioFilename = `${uuidv4()}${path.extname(audioFile.originalFilename)}`;

      // Move files to permanent location
      const videoPath = path.join(form.uploadDir, videoFilename);
      const thumbnailPath = path.join(form.uploadDir, thumbnailFilename);
      const audioPath = path.join(form.uploadDir, audioFilename);

      fs.renameSync(videoFile.filepath, videoPath);
      fs.renameSync(thumbnailFile.filepath, thumbnailPath);
      fs.renameSync(audioFile.filepath, audioPath);

      // Update recording record in database
      const recording = await prisma.sessionRecording.update({
        where: {
          sessionId_clientId: {
            sessionId,
            clientId
          }
        },
        data: {
          processedFilename: videoFilename,
          processedFilepath: videoPath,
          thumbnailFilename,
          thumbnailFilepath: thumbnailPath,
          audioFilename,
          audioFilepath: audioPath,
          status: 'processed',
          processedAt: new Date()
        }
      });

      // Create thumbnail record
      const thumbnail = await prisma.recordingThumbnail.create({
        data: {
          recordingId: recording.id,
          timestamp: 1, // First second of video
          filepath: thumbnailPath
        }
      });

      return res.status(201).json({
        success: true,
        recording: {
          id: recording.id,
          status: recording.status,
          thumbnail: thumbnail.id
        }
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in upload-processed API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 