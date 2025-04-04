import { callAssistantApi } from '../../../utils/apiHelpers';
import { validateHIPAACompliance } from '../../../utils/hipaaUtils';

// Evidence-based protocols data
const evidenceBasedProtocols = [
  {
    id: 'cbt-depression',
    name: 'CBT for Depression',
    description: 'Cognitive Behavioral Therapy protocol for treating depression',
    defaultContext: {
      diagnosis: 'depression',
      severity: 'moderate',
      duration: '12 weeks'
    },
    phases: [
      {
        name: 'Assessment & Engagement',
        duration: '1-2 sessions',
        interventions: [
          'Initial assessment',
          'Goal setting',
          'Psychoeducation about depression'
        ]
      },
      {
        name: 'Core CBT Skills',
        duration: '6-8 sessions',
        interventions: [
          'Cognitive restructuring',
          'Behavioral activation',
          'Problem-solving skills'
        ]
      },
      {
        name: 'Relapse Prevention',
        duration: '2-3 sessions',
        interventions: [
          'Identifying triggers',
          'Developing coping strategies',
          'Creating maintenance plan'
        ]
      }
    ],
    evidence: 'Strong research support for treating moderate to severe depression',
    references: [
      'Beck, J. S. (2011). Cognitive behavior therapy: Basics and beyond',
      'Hofmann, S. G., et al. (2012). The efficacy of cognitive behavioral therapy'
    ]
  },
  {
    id: 'cbt-anxiety',
    name: 'CBT for Anxiety',
    description: 'Cognitive Behavioral Therapy protocol for treating anxiety disorders',
    defaultContext: {
      diagnosis: 'anxiety',
      severity: 'moderate',
      duration: '12-16 weeks'
    },
    phases: [
      {
        name: 'Assessment & Engagement',
        duration: '1-2 sessions',
        interventions: [
          'Initial assessment',
          'Goal setting',
          'Psychoeducation about anxiety'
        ]
      },
      {
        name: 'Core CBT Skills',
        duration: '8-10 sessions',
        interventions: [
          'Cognitive restructuring',
          'Exposure therapy',
          'Relaxation techniques'
        ]
      },
      {
        name: 'Relapse Prevention',
        duration: '2-3 sessions',
        interventions: [
          'Identifying triggers',
          'Developing coping strategies',
          'Creating maintenance plan'
        ]
      }
    ],
    evidence: 'Strong research support for treating various anxiety disorders',
    references: [
      'Barlow, D. H. (2007). Clinical handbook of psychological disorders',
      'Hofmann, S. G., & Smits, J. A. (2008). Cognitive-behavioral therapy for anxiety'
    ]
  },
  {
    id: 'cpt-ptsd',
    name: 'CPT for PTSD',
    description: 'Cognitive Processing Therapy protocol for treating PTSD',
    defaultContext: {
      diagnosis: 'ptsd',
      severity: 'moderate',
      duration: '12 weeks'
    },
    phases: [
      {
        name: 'Assessment & Engagement',
        duration: '1-2 sessions',
        interventions: [
          'Initial assessment',
          'Goal setting',
          'Psychoeducation about PTSD'
        ]
      },
      {
        name: 'Core CPT Skills',
        duration: '8-10 sessions',
        interventions: [
          'Impact statement',
          'Cognitive worksheets',
          'Trauma narrative'
        ]
      },
      {
        name: 'Relapse Prevention',
        duration: '2-3 sessions',
        interventions: [
          'Identifying triggers',
          'Developing coping strategies',
          'Creating maintenance plan'
        ]
      }
    ],
    evidence: 'Strong research support for treating PTSD',
    references: [
      'Resick, P. A., et al. (2016). Cognitive processing therapy for PTSD',
      'Monson, C. M., & Shnaider, P. (2014). Treating PTSD with cognitive-behavioral therapies'
    ]
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Validate HIPAA compliance of request
    if (!validateHIPAACompliance(JSON.stringify(req.query))) {
      return res.status(400).json({ 
        message: 'Request contains potentially sensitive information' 
      });
    }

    // Return protocols
    return res.status(200).json({
      protocols: evidenceBasedProtocols
    });
  } catch (error) {
    console.error('Error in protocols API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 