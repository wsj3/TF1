/**
 * Treatment Plan Templates
 * 
 * This file provides a collection of evidence-based treatment plan templates
 * for common mental health conditions. Each template includes goals, objectives,
 * interventions, and progress measurement considerations.
 */

// Array of predefined treatment plan templates
export const treatmentTemplates = [
  {
    id: 'depression',
    name: 'Major Depressive Disorder',
    description: 'Evidence-based treatment plan for moderate to severe depression',
    goals: [
      {
        id: 'dep-goal-1',
        description: 'Reduce depressive symptoms as measured by PHQ-9',
        objectives: [
          'Decrease negative thought patterns',
          'Increase engagement in pleasurable activities',
          'Improve sleep hygiene and quality',
          'Develop effective coping strategies for stress'
        ],
        interventions: [
          'Cognitive Behavioral Therapy (CBT) to identify and modify negative thought patterns',
          'Activity scheduling for behavioral activation',
          'Sleep hygiene education and monitoring',
          'Mindfulness and relaxation techniques'
        ],
        progressMeasures: ['PHQ-9 score reduction of at least 5 points', 'Daily mood tracking']
      },
      {
        id: 'dep-goal-2',
        description: 'Improve social functioning and support system',
        objectives: [
          'Increase frequency of social interactions',
          'Improve quality of existing relationships',
          'Develop assertiveness skills'
        ],
        interventions: [
          'Social skills training',
          'Family/couples therapy as appropriate',
          'Role-playing exercises for communication skills',
          'Gradual exposure to social situations'
        ],
        progressMeasures: ['Number of social interactions per week', 'Relationship satisfaction scale']
      }
    ],
    estimatedDuration: '12-16 weeks',
    recommendedFrequency: 'Weekly sessions'
  },
  {
    id: 'anxiety',
    name: 'Generalized Anxiety Disorder',
    description: 'Comprehensive treatment plan for managing chronic anxiety',
    goals: [
      {
        id: 'anx-goal-1',
        description: 'Reduce anxiety symptoms as measured by GAD-7',
        objectives: [
          'Identify and modify anxious thought patterns',
          'Develop physiological self-regulation skills',
          'Reduce avoidance behaviors',
          'Improve stress management'
        ],
        interventions: [
          'Cognitive restructuring of anxious thoughts',
          'Progressive muscle relaxation and diaphragmatic breathing',
          'Graded exposure to anxiety-provoking situations',
          'Mindfulness-based stress reduction'
        ],
        progressMeasures: ['GAD-7 score reduction of at least 5 points', 'Subjective Units of Distress Scale (SUDS)']
      },
      {
        id: 'anx-goal-2',
        description: 'Develop long-term anxiety management strategies',
        objectives: [
          'Create personalized anxiety management toolkit',
          'Identify early warning signs of increasing anxiety',
          'Establish regular stress-reduction practices'
        ],
        interventions: [
          'Development of personalized coping cards',
          'Relapse prevention planning',
          'Lifestyle modification (exercise, nutrition, sleep)',
          'Mindfulness practice'
        ],
        progressMeasures: ['Frequency of successful anxiety management', 'Quality of life assessment']
      }
    ],
    estimatedDuration: '12-20 weeks',
    recommendedFrequency: 'Weekly sessions initially, tapering to biweekly'
  },
  {
    id: 'trauma',
    name: 'Post-Traumatic Stress Disorder',
    description: 'Trauma-focused treatment plan for PTSD',
    goals: [
      {
        id: 'ptsd-goal-1',
        description: 'Reduce intrusive symptoms and reactivity',
        objectives: [
          'Develop skills to manage trauma triggers',
          'Reduce frequency and intensity of flashbacks/nightmares',
          'Decrease hyperarousal symptoms',
          'Improve emotional regulation'
        ],
        interventions: [
          'Trauma-focused cognitive behavioral therapy (TF-CBT)',
          'Grounding techniques for flashbacks',
          'Nightmare rescripting protocol',
          'Emotional regulation skills training'
        ],
        progressMeasures: ['PCL-5 score reduction', 'Frequency and intensity of intrusive symptoms']
      },
      {
        id: 'ptsd-goal-2',
        description: 'Process traumatic memories',
        objectives: [
          'Develop trauma narrative',
          'Reduce avoidance of trauma-related thoughts/situations',
          'Integrate traumatic experiences into cohesive self-concept'
        ],
        interventions: [
          'EMDR therapy or prolonged exposure',
          'Cognitive processing therapy',
          'Narrative exposure therapy',
          'Meaning-making exercises'
        ],
        progressMeasures: ['Subjective Units of Distress when discussing trauma', 'Reduction in avoidance behaviors']
      }
    ],
    estimatedDuration: '16-24 weeks',
    recommendedFrequency: 'Weekly sessions'
  },
  {
    id: 'substance',
    name: 'Substance Use Disorder',
    description: 'Recovery-oriented treatment plan for substance use disorders',
    goals: [
      {
        id: 'sud-goal-1',
        description: 'Achieve and maintain abstinence or reduction in substance use',
        objectives: [
          'Identify triggers for substance use',
          'Develop alternative coping strategies',
          'Create a relapse prevention plan',
          'Build recovery support network'
        ],
        interventions: [
          'Motivational interviewing',
          'Cognitive behavioral therapy for substance use',
          'Contingency management',
          'Referral to appropriate support groups (e.g., AA, NA, SMART Recovery)'
        ],
        progressMeasures: ['Days of abstinence or controlled use', 'Urinalysis results', 'Craving intensity ratings']
      },
      {
        id: 'sud-goal-2',
        description: 'Address underlying issues contributing to substance use',
        objectives: [
          'Identify and address co-occurring mental health conditions',
          'Develop healthy coping mechanisms',
          'Rebuild damaged relationships',
          'Establish meaningful substance-free activities'
        ],
        interventions: [
          'Integrated treatment for co-occurring disorders',
          'Family therapy',
          'Interpersonal skills training',
          'Values clarification and goal-setting'
        ],
        progressMeasures: ['Improvement in co-occurring symptoms', 'Relationship satisfaction', 'Life satisfaction']
      }
    ],
    estimatedDuration: '6-12 months',
    recommendedFrequency: 'Weekly initially, decreasing based on progress'
  },
  {
    id: 'bipolar',
    name: 'Bipolar Disorder',
    description: 'Stabilization and management plan for bipolar disorder',
    goals: [
      {
        id: 'bip-goal-1',
        description: 'Achieve and maintain mood stability',
        objectives: [
          'Identify early warning signs of mood episodes',
          'Establish regular daily routines',
          'Maintain medication adherence',
          'Reduce frequency and severity of mood episodes'
        ],
        interventions: [
          'Psychoeducation about bipolar disorder',
          'Mood charting and monitoring',
          'Sleep hygiene and routine development',
          'Medication management coordination'
        ],
        progressMeasures: ['Mood stability tracking', 'Number of days between episodes', 'ASRM and PHQ-9 scores']
      },
      {
        id: 'bip-goal-2',
        description: 'Develop effective coping strategies for mood management',
        objectives: [
          'Create personalized crisis plan',
          'Identify and manage stress triggers',
          'Improve interpersonal communication during mood fluctuations',
          'Balance activity levels appropriately'
        ],
        interventions: [
          'Interpersonal and social rhythm therapy (IPSRT)',
          'Cognitive behavioral therapy for bipolar disorder',
          'Family-focused therapy',
          'Crisis planning'
        ],
        progressMeasures: ['Effective use of coping strategies', 'Reduction in crisis situations', 'Social functioning']
      }
    ],
    estimatedDuration: 'Ongoing with periodic intensive phases',
    recommendedFrequency: 'Biweekly maintenance, increasing during unstable periods'
  }
];

/**
 * Get a specific treatment plan template by ID
 * 
 * @param {string} templateId - The ID of the template to retrieve
 * @returns {Object|null} The template object or null if not found
 */
export function getTemplateById(templateId) {
  return treatmentTemplates.find(template => template.id === templateId) || null;
}

/**
 * Search templates by name or description
 * 
 * @param {string} query - The search query
 * @returns {Array} Array of matching templates
 */
export function searchTemplates(query) {
  if (!query) return treatmentTemplates;
  
  const lowercaseQuery = query.toLowerCase();
  return treatmentTemplates.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) || 
    template.description.toLowerCase().includes(lowercaseQuery)
  );
}

export default {
  treatmentTemplates,
  getTemplateById,
  searchTemplates
}; 