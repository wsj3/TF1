import { getClientById } from '../../../utils/clientUtils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { clientId, planTitle, existingGoals = [] } = req.body;
    
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }
    
    // Get client data
    const client = getClientById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Generate AI suggestions based on client data
    const suggestions = generateTreatmentSuggestions(client, planTitle, existingGoals);
    
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error generating treatment suggestions:', error);
    return res.status(500).json({ message: 'Failed to generate treatment suggestions' });
  }
}

/**
 * Generate treatment suggestions based on client data and existing goals
 * 
 * In a real application, this would use an actual AI model or external API.
 * For this demo, we'll use predefined evidence-based responses based on client conditions.
 * 
 * @param {Object} client - Client data
 * @param {string} planTitle - Treatment plan title
 * @param {Array} existingGoals - Existing goals to avoid duplication
 * @returns {Object} Suggested goals and interventions
 */
function generateTreatmentSuggestions(client, planTitle, existingGoals) {
  // Find relevant conditions from client info
  const conditions = [];
  
  if (client.presenting) {
    const presenting = client.presenting.toLowerCase();
    
    if (presenting.includes('anxiety')) conditions.push('anxiety');
    if (presenting.includes('depression')) conditions.push('depression');
    if (presenting.includes('trauma') || presenting.includes('ptsd')) conditions.push('trauma');
    if (presenting.includes('stress')) conditions.push('stress');
    if (presenting.includes('addiction') || presenting.includes('substance')) conditions.push('addiction');
    if (presenting.includes('insomnia') || presenting.includes('sleep')) conditions.push('sleep');
  }
  
  if (client.diagnoses && client.diagnoses.length > 0) {
    const diagnoses = client.diagnoses.join(' ').toLowerCase();
    
    if (diagnoses.includes('anxiety') || diagnoses.includes('f41')) {
      conditions.push('anxiety');
    }
    if (diagnoses.includes('depress') || diagnoses.includes('f32') || diagnoses.includes('f33')) {
      conditions.push('depression');
    }
    if (diagnoses.includes('trauma') || diagnoses.includes('ptsd') || diagnoses.includes('f43.1')) {
      conditions.push('trauma');
    }
    if (diagnoses.includes('adjust') || diagnoses.includes('f43.2')) {
      conditions.push('stress');
    }
    if (diagnoses.includes('substance') || diagnoses.includes('f10') || diagnoses.includes('f11')) {
      conditions.push('addiction');
    }
    if (diagnoses.includes('insomnia') || diagnoses.includes('f51')) {
      conditions.push('sleep');
    }
  }
  
  // If no conditions found or just for demo clients, provide generic suggestions
  if (conditions.length === 0 || client.id.startsWith('demo')) {
    // If plan title gives clues, use that
    const title = (planTitle || '').toLowerCase();
    
    if (title.includes('anxiety')) conditions.push('anxiety');
    if (title.includes('depress')) conditions.push('depression');
    if (title.includes('trauma')) conditions.push('trauma');
    if (title.includes('stress')) conditions.push('stress');
    if (title.includes('addiction') || title.includes('recovery')) conditions.push('addiction');
    if (title.includes('sleep') || title.includes('insomnia')) conditions.push('sleep');
    
    // For demo purposes, add some default conditions if none detected
    if (conditions.length === 0) {
      if (client.id === 'demo-1') conditions.push('anxiety');
      else if (client.id === 'demo-2') conditions.push('depression');
      else if (client.id === 'demo-3') conditions.push('trauma');
      else if (client.id === 'demo-4') conditions.push('stress');
      else if (client.id === 'demo-5') conditions.push('depression');
      else conditions.push('general');
    }
  }
  
  // Remove duplicates
  const uniqueConditions = [...new Set(conditions)];
  
  // Get relevant suggestions based on conditions
  let suggestedGoals = [];
  let suggestedInterventions = [];
  
  uniqueConditions.forEach(condition => {
    const { goals, interventions } = getSuggestionsForCondition(condition);
    suggestedGoals = [...suggestedGoals, ...goals];
    suggestedInterventions = [...suggestedInterventions, ...interventions];
  });
  
  // Filter out goals that are already in the plan (based on description similarity)
  const filteredGoals = suggestedGoals.filter(suggested => {
    return !existingGoals.some(existing => 
      isSimilarText(suggested.description, existing)
    );
  });
  
  // Limit number of suggestions
  return {
    goals: filteredGoals.slice(0, 5),
    interventions: suggestedInterventions.slice(0, 5)
  };
}

/**
 * Compare two text strings for similarity
 * 
 * @param {string} text1 - First text string
 * @param {string} text2 - Second text string
 * @returns {boolean} - True if texts are similar
 */
function isSimilarText(text1, text2) {
  const normalizedText1 = text1.toLowerCase().trim();
  const normalizedText2 = text2.toLowerCase().trim();
  
  // Simple contains check
  return normalizedText1.includes(normalizedText2) || 
         normalizedText2.includes(normalizedText1);
}

/**
 * Get evidence-based suggestions for a specific condition
 * 
 * @param {string} condition - Health condition
 * @returns {Object} - Goals and interventions for the condition
 */
function getSuggestionsForCondition(condition) {
  switch (condition) {
    case 'anxiety':
      return {
        goals: [
          {
            description: 'Reduce frequency and intensity of anxiety symptoms in triggering situations',
            objectives: [
              {
                description: 'Identify and challenge negative thought patterns using CBT techniques',
                measurable: 'Track and reduce cognitive distortions by 30% in 8 weeks'
              },
              {
                description: 'Practice deep breathing exercises when feeling anxious',
                measurable: 'Daily practice for at least 5 minutes'
              }
            ]
          },
          {
            description: 'Develop and implement healthy coping strategies for managing anxiety',
            objectives: [
              {
                description: 'Create a personalized anxiety management plan with specific techniques',
                measurable: 'Complete plan within 2 weeks and implement daily'
              }
            ]
          },
          {
            description: 'Gradual exposure to anxiety-provoking situations with decreasing distress',
            objectives: [
              {
                description: 'Create hierarchy of anxiety-provoking situations',
                measurable: 'Complete hierarchy within 2 weeks'
              },
              {
                description: 'Gradually expose to items on hierarchy with anxiety rating below 5/10',
                measurable: 'Weekly exposure practice with decreasing anxiety ratings'
              }
            ]
          }
        ],
        interventions: [
          {
            description: 'Cognitive Behavioral Therapy focusing on identifying and challenging anxiety-related thoughts',
            evidence: 'Strong research support for anxiety disorders with 60-80% response rate',
            source: 'Multiple meta-analyses (e.g., Hofmann et al., 2012)'
          },
          {
            description: 'Mindfulness-Based Stress Reduction techniques',
            evidence: 'Moderate to strong evidence for reducing anxiety symptoms',
            source: 'Systematic reviews (e.g., Khoury et al., 2013)'
          },
          {
            description: 'Gradual exposure therapy with relaxation training',
            evidence: 'Strong evidence for specific phobias and social anxiety',
            source: 'Cochrane Reviews'
          }
        ]
      };
      
    case 'depression':
      return {
        goals: [
          {
            description: 'Reduce depressive symptoms and improve overall mood',
            objectives: [
              {
                description: 'Engage in daily mood monitoring and identify patterns',
                measurable: 'Complete daily mood tracking for 4 weeks'
              },
              {
                description: 'Increase positive activities that previously brought joy or satisfaction',
                measurable: 'Engage in at least 3 pleasurable activities per week'
              }
            ]
          },
          {
            description: 'Establish consistent daily routine to improve functioning',
            objectives: [
              {
                description: 'Create and maintain regular sleep schedule',
                measurable: 'Consistent bed/wake times within 30 minutes 6 days/week'
              },
              {
                description: 'Incorporate physical activity into daily routine',
                measurable: '30 minutes of moderate exercise at least 3 times per week'
              }
            ]
          },
          {
            description: 'Identify and challenge negative thought patterns that maintain depression',
            objectives: [
              {
                description: 'Learn to recognize cognitive distortions in daily thoughts',
                measurable: 'Identify at least 10 examples of cognitive distortions over 2 weeks'
              },
              {
                description: 'Practice reframing negative thoughts with more balanced perspectives',
                measurable: 'Complete thought records for 5 situations per week'
              }
            ]
          }
        ],
        interventions: [
          {
            description: 'Behavioral Activation to increase engagement in pleasurable and meaningful activities',
            evidence: 'Strong evidence for treating depression, comparable to cognitive therapy',
            source: 'Systematic reviews (e.g., Cuijpers et al., 2007)'
          },
          {
            description: 'Cognitive Therapy focusing on identifying and restructuring negative thought patterns',
            evidence: 'Strong evidence for treating depression and preventing relapse',
            source: 'Multiple meta-analyses'
          },
          {
            description: 'Exercise therapy (moderate intensity aerobic exercise)',
            evidence: 'Moderate evidence for mild to moderate depression',
            source: 'Cochrane Reviews'
          },
          {
            description: 'Interpersonal Therapy focusing on relationship issues and social functioning',
            evidence: 'Strong evidence for treating depression',
            source: 'WHO recommendations and meta-analyses'
          }
        ]
      };
      
    case 'trauma':
      return {
        goals: [
          {
            description: 'Reduce intensity and frequency of trauma-related symptoms',
            objectives: [
              {
                description: 'Learn and practice grounding techniques for managing flashbacks and intrusive memories',
                measurable: 'Demonstrate ability to use 3 different grounding techniques'
              },
              {
                description: 'Develop personalized safety plan for managing trauma triggers',
                measurable: 'Complete safety plan within 2 weeks and update as needed'
              }
            ]
          },
          {
            description: 'Process traumatic memories and reduce their emotional impact',
            objectives: [
              {
                description: 'Gradually create a coherent narrative of traumatic experiences',
                measurable: 'Complete trauma narrative with reduced distress ratings'
              }
            ]
          },
          {
            description: 'Re-engage in previously avoided activities and situations',
            objectives: [
              {
                description: 'Identify activities and situations being avoided due to trauma',
                measurable: 'Create list of at least 10 avoided situations within 2 weeks'
              },
              {
                description: 'Gradually engage in avoided activities with decreasing distress',
                measurable: 'Weekly engagement with items on avoidance list'
              }
            ]
          }
        ],
        interventions: [
          {
            description: 'Trauma-Focused Cognitive Behavioral Therapy',
            evidence: 'Strong evidence for reducing PTSD symptoms',
            source: 'Multiple clinical guidelines and meta-analyses'
          },
          {
            description: 'Eye Movement Desensitization and Reprocessing (EMDR)',
            evidence: 'Strong evidence for treating PTSD',
            source: 'WHO recommendations and meta-analyses'
          },
          {
            description: 'Skills Training in Affective and Interpersonal Regulation (STAIR)',
            evidence: 'Evidence for improving emotion regulation in trauma survivors',
            source: 'Clinical trials (e.g., Cloitre et al., 2010)'
          }
        ]
      };
      
    case 'stress':
      return {
        goals: [
          {
            description: 'Develop effective stress management strategies for daily use',
            objectives: [
              {
                description: 'Learn and practice at least 3 different stress reduction techniques',
                measurable: 'Daily practice of at least one technique for 10 minutes'
              },
              {
                description: 'Identify personal stress triggers and early warning signs',
                measurable: 'Create comprehensive list within 2 weeks'
              }
            ]
          },
          {
            description: 'Achieve better work-life balance to reduce overall stress levels',
            objectives: [
              {
                description: 'Establish boundaries between work and personal time',
                measurable: 'Define specific non-work hours and adhere to them 5 days/week'
              },
              {
                description: 'Schedule regular self-care activities',
                measurable: 'Engage in planned self-care at least 3 times per week'
              }
            ]
          }
        ],
        interventions: [
          {
            description: 'Mindfulness-Based Stress Reduction (MBSR)',
            evidence: 'Strong evidence for reducing stress and improving well-being',
            source: 'Multiple systematic reviews'
          },
          {
            description: 'Progressive Muscle Relaxation',
            evidence: 'Moderate evidence for reducing physical symptoms of stress',
            source: 'Meta-analyses of relaxation techniques'
          },
          {
            description: 'Problem-solving therapy',
            evidence: 'Evidence for helping manage stressful life circumstances',
            source: 'Clinical trials and guidelines'
          }
        ]
      };
      
    case 'addiction':
      return {
        goals: [
          {
            description: 'Achieve and maintain abstinence or reduced substance use',
            objectives: [
              {
                description: 'Identify high-risk situations and develop coping strategies',
                measurable: 'Create detailed relapse prevention plan within 3 weeks'
              },
              {
                description: 'Establish routine for monitoring cravings and triggers',
                measurable: 'Daily tracking of cravings with intensity ratings'
              }
            ]
          },
          {
            description: 'Build supportive social network that encourages recovery',
            objectives: [
              {
                description: 'Engage with support group or recovery community',
                measurable: 'Attend at least 1 support group meeting weekly'
              },
              {
                description: 'Identify and connect with sober supports',
                measurable: 'List at least 3 people who can provide support in recovery'
              }
            ]
          },
          {
            description: 'Develop healthy coping mechanisms to replace substance use',
            objectives: [
              {
                description: 'Identify situations previously managed with substances',
                measurable: 'Create list of at least 10 situations within 2 weeks'
              },
              {
                description: 'Learn and practice alternative coping strategies',
                measurable: 'Demonstrate at least 5 effective coping strategies'
              }
            ]
          }
        ],
        interventions: [
          {
            description: 'Motivational Interviewing to enhance motivation for change',
            evidence: 'Strong evidence for substance use disorders',
            source: 'Cochrane Reviews and clinical guidelines'
          },
          {
            description: 'Cognitive Behavioral Therapy for Substance Use Disorders',
            evidence: 'Strong evidence for various substance use problems',
            source: 'Multiple meta-analyses and clinical trials'
          },
          {
            description: 'Contingency Management approaches',
            evidence: 'Strong evidence for encouraging abstinence',
            source: 'Multiple systematic reviews'
          },
          {
            description: 'Community Reinforcement Approach',
            evidence: 'Strong evidence particularly for alcohol use disorders',
            source: 'Multiple clinical trials'
          }
        ]
      };
      
    case 'sleep':
      return {
        goals: [
          {
            description: 'Establish healthy sleep routine and improve sleep quality',
            objectives: [
              {
                description: 'Maintain consistent sleep and wake times',
                measurable: 'Consistent schedule within 30 minutes 6 days/week'
              },
              {
                description: 'Create and implement calming bedtime routine',
                measurable: 'Follow 30-minute pre-sleep routine 5 nights/week'
              }
            ]
          },
          {
            description: 'Reduce factors that interfere with sleep quality',
            objectives: [
              {
                description: 'Identify and modify environmental factors affecting sleep',
                measurable: 'Make at least 3 environmental improvements within 2 weeks'
              },
              {
                description: 'Limit screen time before bed',
                measurable: 'No screens 1 hour before bedtime 5 nights/week'
              }
            ]
          }
        ],
        interventions: [
          {
            description: 'Cognitive Behavioral Therapy for Insomnia (CBT-I)',
            evidence: 'Strong evidence as first-line treatment for insomnia',
            source: 'Clinical practice guidelines and meta-analyses'
          },
          {
            description: 'Sleep restriction therapy',
            evidence: 'Strong evidence for improving sleep efficiency',
            source: 'Component of CBT-I with research support'
          },
          {
            description: 'Stimulus control therapy',
            evidence: 'Evidence for breaking associations between bed and wakefulness',
            source: 'Systematic reviews of behavioral sleep interventions'
          }
        ]
      };
      
    default: // General mental health
      return {
        goals: [
          {
            description: 'Improve overall emotional well-being and self-care',
            objectives: [
              {
                description: 'Establish regular self-care routine',
                measurable: 'Engage in planned self-care activities 3 times/week'
              },
              {
                description: 'Practice mindfulness or relaxation techniques regularly',
                measurable: 'Daily practice for at least 10 minutes'
              }
            ]
          },
          {
            description: 'Enhance social support and connections',
            objectives: [
              {
                description: 'Identify and engage with supportive relationships',
                measurable: 'Meaningful social interaction at least twice weekly'
              }
            ]
          },
          {
            description: 'Develop effective communication and coping skills',
            objectives: [
              {
                description: 'Learn and practice assertive communication techniques',
                measurable: 'Use assertive communication in at least 3 situations weekly'
              },
              {
                description: 'Identify personal stressors and develop coping strategies',
                measurable: 'Create personalized stress management plan within 3 weeks'
              }
            ]
          }
        ],
        interventions: [
          {
            description: 'Solution-Focused Brief Therapy',
            evidence: 'Evidence for various mental health concerns',
            source: 'Systematic reviews and clinical trials'
          },
          {
            description: 'Acceptance and Commitment Therapy (ACT)',
            evidence: 'Evidence for improving psychological flexibility',
            source: 'Meta-analyses across various conditions'
          },
          {
            description: 'Lifestyle interventions (exercise, nutrition, sleep)',
            evidence: 'Evidence for overall mental health and well-being',
            source: 'Various research on lifestyle factors and mental health'
          }
        ]
      };
  }
} 