import { v4 as uuidv4 } from 'uuid';
import { aiAgent } from '../../../utils/aiFramework/agent';

/**
 * API endpoint to generate treatment suggestions using AI
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { clientInfo, presentingProblems, goals } = req.body;
    
    // Validate inputs
    if (!clientInfo) {
      return res.status(400).json({ message: 'Client information is required' });
    }
    
    if (!presentingProblems || !presentingProblems.length) {
      return res.status(400).json({ message: 'At least one presenting problem is required' });
    }
    
    // Initial safety check
    const safetyCheck = await checkContentSafety(clientInfo, presentingProblems);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({ 
        message: 'The request contains potentially inappropriate content.',
        details: safetyCheck.reason
      });
    }
    
    // Format the query for the AI
    const query = formatAIQuery(clientInfo, presentingProblems, goals);
    
    // Generate AI response
    const aiResponse = await generateTreatmentSuggestions(query);
    
    // Process and format the AI response
    const suggestions = processAIResponse(aiResponse);
    
    return res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error generating treatment suggestions:', error);
    return res.status(500).json({ 
      message: 'Failed to generate treatment suggestions',
      error: error.message
    });
  }
}

/**
 * Check input content for safety
 */
async function checkContentSafety(clientInfo, presentingProblems) {
  // In a real implementation, this would use content moderation APIs
  // For now, we'll do a simple check for obvious red flags
  
  const combinedText = [
    JSON.stringify(clientInfo),
    ...presentingProblems
  ].join(' ').toLowerCase();
  
  const dangerFlags = [
    'suicide', 'kill', 'harm', 'die', 'hurt myself',
    'end my life', 'want to die', 'self harm'
  ];
  
  for (const flag of dangerFlags) {
    if (combinedText.includes(flag)) {
      return {
        isSafe: false,
        reason: 'Input contains content that suggests immediate risk. Please contact emergency services if client is in danger.'
      };
    }
  }
  
  return { isSafe: true };
}

/**
 * Format query for AI
 */
function formatAIQuery(clientInfo, presentingProblems, goals) {
  // Basic demographics string
  const demographics = `Client is a ${clientInfo.age || 'adult'} ${clientInfo.gender || 'person'}`;
  
  // Format presenting problems
  const problemsString = presentingProblems.map(p => `- ${p}`).join('\\n');
  
  // Format goals if provided
  const goalsString = goals && goals.length 
    ? '\\nClient goals:\\n' + goals.map(g => `- ${g}`).join('\\n')
    : '';
  
  return `Generate evidence-based treatment suggestions for the following client:
  
  ${demographics}
  
  Presenting problems:
  ${problemsString}
  ${goalsString}
  
  Provide suggestions in the following format:
  1. Recommended approaches with brief explanations
  2. Potential interventions with evidence basis
  3. Suggested goals and measurable objectives
  4. Estimated timeline for treatment
  
  Base all suggestions on evidence-based practices and current clinical guidelines.`;
}

/**
 * Generate treatment suggestions using AI
 */
async function generateTreatmentSuggestions(query) {
  try {
    // If AI agent is available, use it
    if (aiAgent && typeof aiAgent.executePrompt === 'function') {
      const response = await aiAgent.executePrompt(query, {
        role: 'clinical-advisor',
        maxTokens: 1000
      });
      return response;
    }
    
    // Fallback to demo responses if AI is not available
    return generateDemoResponse(query);
  } catch (error) {
    console.error('Error calling AI agent:', error);
    return generateDemoResponse(query);
  }
}

/**
 * Process AI response into structured format
 */
function processAIResponse(response) {
  // In a real implementation, this would parse the AI response
  // and structure it properly. For now, we'll return a simple object
  
  return {
    approaches: extractSection(response, 'approaches', 'interventions'),
    interventions: extractSection(response, 'interventions', 'goals'),
    goals: extractSection(response, 'goals', 'timeline'),
    timeline: extractSection(response, 'timeline', null),
    rawResponse: response
  };
}

/**
 * Extract a section from the AI response
 */
function extractSection(text, sectionName, nextSectionName) {
  try {
    // Simple regex extraction - in a real app, would be more robust
    const pattern = nextSectionName 
      ? new RegExp(`${sectionName}[:\\s]+(.*?)(?=${nextSectionName}[:\\s]+)`, 'is')
      : new RegExp(`${sectionName}[:\\s]+(.*?)$`, 'is');
    
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  } catch (error) {
    console.error(`Error extracting ${sectionName} section:`, error);
    return '';
  }
}

/**
 * Generate demo response when AI is not available
 */
function generateDemoResponse(query) {
  // Extract info from query to customize demo response
  const hasAnxiety = query.toLowerCase().includes('anxiety');
  const hasDepression = query.toLowerCase().includes('depression');
  const hasTrauma = query.toLowerCase().includes('trauma');
  
  let response = '';
  
  if (hasAnxiety) {
    response = `
Recommended approaches:
1. Cognitive Behavioral Therapy (CBT) - Substantial evidence base for anxiety disorders, focusing on identifying and challenging anxious thoughts and behaviors.
2. Exposure Therapy - Particularly effective for phobias and OCD, involving gradual exposure to anxiety triggers in a safe environment.
3. Mindfulness-Based Stress Reduction (MBSR) - Teaches present-moment awareness and acceptance to reduce anxiety responses.

Potential interventions:
1. Progressive muscle relaxation and diaphragmatic breathing techniques - Daily practice shown to reduce physiological symptoms of anxiety.
2. Cognitive restructuring exercises - Identifying and challenging anxious thoughts with evidence-based alternatives.
3. Behavioral experiments - Testing feared outcomes in real-world situations to gather evidence against anxiety predictions.
4. Mindfulness meditation - Regular practice shown in multiple studies to reduce anxiety symptoms.

Suggested goals and measurable objectives:
1. Reduce overall anxiety levels (measured by GAD-7 or similar validated scale)
   - Objective: Decrease GAD-7 score by 50% within 12 weeks
   - Objective: Practice relaxation techniques daily for 10 minutes
2. Increase engagement in previously avoided activities
   - Objective: Create hierarchy of feared situations and engage in at least 3 per week
   - Objective: Track and gradually increase time spent in anxiety-provoking situations

Estimated timeline for treatment:
- Initial assessment and psychoeducation: 1-2 sessions
- Core CBT skills development: 4-6 sessions
- Exposure work and practice: 6-8 sessions
- Relapse prevention and maintenance: 2-3 sessions
- Total treatment duration: Approximately 12-16 weeks, with weekly sessions`;
  } else if (hasDepression) {
    response = `
Recommended approaches:
1. Cognitive Behavioral Therapy (CBT) - Strong evidence base for depression, focused on changing negative thought patterns and behavioral activation.
2. Interpersonal Therapy (IPT) - Addresses interpersonal issues and role transitions that may contribute to depression.
3. Behavioral Activation (BA) - Focuses on increasing engagement with rewarding activities and positive reinforcement.

Potential interventions:
1. Behavioral activation exercises - Scheduling and engaging in pleasurable and mastery activities daily.
2. Cognitive restructuring - Identifying and challenging depressive thoughts and core beliefs.
3. Sleep hygiene improvements - Research shows strong connection between sleep quality and depression severity.
4. Exercise program - Multiple studies show moderate exercise (30 min, 3x weekly) can significantly reduce depression symptoms.

Suggested goals and measurable objectives:
1. Reduce depressive symptoms (measured by PHQ-9 or similar validated scale)
   - Objective: Decrease PHQ-9 score by 50% within 16 weeks
   - Objective: Complete daily mood and activity tracking
2. Increase daily activity levels and engagement
   - Objective: Schedule and complete at least 3 positive activities daily
   - Objective: Exercise for 30 minutes at least 3 times per week

Estimated timeline for treatment:
- Initial assessment and psychoeducation: 1-2 sessions
- Behavioral activation focus: 3-4 sessions
- Cognitive work: 4-6 sessions
- Maintenance and relapse prevention: 3-4 sessions
- Total treatment duration: Approximately 14-20 weeks, with weekly sessions tapering to biweekly`;
  } else if (hasTrauma) {
    response = `
Recommended approaches:
1. Trauma-Focused Cognitive Behavioral Therapy (TF-CBT) - Evidence-based approach for processing traumatic experiences and managing symptoms.
2. Eye Movement Desensitization and Reprocessing (EMDR) - Well-researched approach for processing traumatic memories.
3. Prolonged Exposure Therapy (PE) - Involves gradual exposure to trauma memories to reduce avoidance and distress.

Potential interventions:
1. Trauma narrative development - Gradual creation and processing of detailed trauma account in safe therapeutic context.
2. Cognitive processing of trauma-related beliefs - Identifying and restructuring unhelpful beliefs resulting from trauma.
3. Grounding and emotional regulation skills - Techniques to manage distress when triggered.
4. In vivo exposure to avoided trauma reminders - Gradual, supported engagement with avoided situations.

Suggested goals and measurable objectives:
1. Reduce PTSD symptoms (measured by PCL-5 or similar validated scale)
   - Objective: Decrease PCL-5 score by 15 points within 20 weeks
   - Objective: Reduce frequency and intensity of nightmares and flashbacks
2. Increase ability to engage with trauma reminders without avoidance
   - Objective: Create hierarchy of avoided situations and progressively engage with them
   - Objective: Develop and practice safety plan for managing triggers

Estimated timeline for treatment:
- Initial assessment, stabilization, and safety planning: 2-3 sessions
- Skill building (emotion regulation, grounding): 3-4 sessions
- Trauma processing work: 8-12 sessions
- Integration and relapse prevention: 3-4 sessions
- Total treatment duration: Approximately 16-24 weekly sessions`;
  } else {
    response = `
Recommended approaches:
1. Cognitive Behavioral Therapy (CBT) - Evidence-based approach for addressing thoughts, emotions, and behaviors contributing to difficulties.
2. Solution-Focused Brief Therapy - Focuses on building solutions rather than analyzing problems, effective for time-limited treatment.
3. Acceptance and Commitment Therapy (ACT) - Combines mindfulness with value-directed behavior change.

Potential interventions:
1. Psychoeducation about presenting problems and treatment options
2. Cognitive restructuring to address unhelpful thought patterns
3. Behavioral activation and scheduling of meaningful activities
4. Mindfulness and present-moment awareness techniques
5. Values clarification and goal-setting exercises

Suggested goals and measurable objectives:
1. Improve overall functioning and well-being
   - Objective: Identify and track 3 key areas for improvement with weekly ratings
   - Objective: Practice new coping skills daily with recorded outcomes
2. Develop more effective responses to stressors
   - Objective: Create and utilize personalized stress management plan
   - Objective: Reduce avoidance behaviors by 50% within 8 weeks

Estimated timeline for treatment:
- Initial assessment and goal setting: 1-2 sessions
- Skill development and practice: 6-8 sessions
- Review of progress and adjustment: 1-2 sessions
- Maintenance and relapse prevention: 1-2 sessions
- Total treatment duration: Approximately 10-14 sessions over 3-4 months`;
  }
  
  return response.trim();
}

/**
 * Export for testing
 */
export const exportedForTesting = {
  formatAIQuery,
  processAIResponse,
  generateDemoResponse
}; 