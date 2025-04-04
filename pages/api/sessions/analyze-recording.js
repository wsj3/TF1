import { verifySessionToken } from '../../../utils/security';
import { hasPermission } from '../../../utils/security';
import { validateHIPAACompliance } from '../../../utils/hipaaUtils';
import { prisma } from '../../../lib/prisma';
import { callAssistantApi } from '../../../utils/apiHelpers';

export default async function handler(req, res) {
  // Verify authentication
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const userData = await verifySessionToken(token);
    
    // Check permissions
    if (!hasPermission(userData.role, 'view_own_records')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    if (req.method === 'POST') {
      const { recordingId, analysisType } = req.body;

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(req.body))) {
        return res.status(400).json({ 
          message: 'Request contains potentially sensitive information' 
        });
      }

      // Get recording details
      const recording = await prisma.sessionRecording.findUnique({
        where: { id: recordingId },
        include: {
          session: true,
          client: true,
          therapist: true
        }
      });

      if (!recording) {
        return res.status(404).json({ message: 'Recording not found' });
      }

      // Get clinical context
      const clinicalContext = await prisma.clinicalContext.findUnique({
        where: { clientId: recording.clientId }
      });

      // Prepare context for AI analysis
      const analysisContext = {
        recordingId,
        sessionType: recording.session.type,
        clientDiagnosis: clinicalContext?.diagnosis,
        clientGoals: clinicalContext?.goals,
        previousSessions: await prisma.session.findMany({
          where: {
            clientId: recording.clientId,
            id: { not: recording.sessionId }
          },
          orderBy: { date: 'desc' },
          take: 5
        })
      };

      // Perform AI analysis based on type
      let analysis;
      switch (analysisType) {
        case 'transcription':
          analysis = await analyzeTranscription(recording, analysisContext);
          break;
        case 'emotional':
          analysis = await analyzeEmotionalContent(recording, analysisContext);
          break;
        case 'clinical':
          analysis = await analyzeClinicalContent(recording, analysisContext);
          break;
        case 'summary':
          analysis = await generateSessionSummary(recording, analysisContext);
          break;
        default:
          return res.status(400).json({ message: 'Invalid analysis type' });
      }

      // Save analysis results
      const savedAnalysis = await prisma.sessionAnalysis.create({
        data: {
          recordingId,
          type: analysisType,
          content: analysis,
          metadata: {
            timestamp: new Date().toISOString(),
            model: 'gpt-4-vision', // Update with actual model used
            confidence: analysis.confidence || 0
          }
        }
      });

      return res.status(201).json({
        success: true,
        analysis: savedAnalysis
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in analyze-recording API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

async function analyzeTranscription(recording, context) {
  // Call AI API for transcription analysis
  const response = await callAssistantApi(
    'Analyze session transcription',
    `transcription-${recording.id}`,
    true,
    `Analyze the session transcription for:
     1. Key topics discussed
     2. Important insights
     3. Action items
     4. Follow-up recommendations
     
     Consider the clinical context and previous sessions.`
  );

  return response.data;
}

async function analyzeEmotionalContent(recording, context) {
  // Call AI API for emotional content analysis
  const response = await callAssistantApi(
    'Analyze emotional content',
    `emotional-${recording.id}`,
    true,
    `Analyze the emotional content of the session for:
     1. Emotional patterns
     2. Significant emotional moments
     3. Progress in emotional regulation
     4. Areas needing attention
     
     Consider the client's diagnosis and treatment goals.`
  );

  return response.data;
}

async function analyzeClinicalContent(recording, context) {
  // Call AI API for clinical content analysis
  const response = await callAssistantApi(
    'Analyze clinical content',
    `clinical-${recording.id}`,
    true,
    `Analyze the clinical content of the session for:
     1. Symptom presentation
     2. Treatment progress
     3. Risk factors
     4. Clinical recommendations
     
     Consider the client's diagnosis, goals, and previous sessions.`
  );

  return response.data;
}

async function generateSessionSummary(recording, context) {
  // Call AI API for session summary
  const response = await callAssistantApi(
    'Generate session summary',
    `summary-${recording.id}`,
    true,
    `Generate a comprehensive session summary including:
     1. Session overview
     2. Key discussion points
     3. Clinical observations
     4. Progress indicators
     5. Recommendations
     6. Next steps
     
     Consider all available context and maintain clinical relevance.`
  );

  return response.data;
} 