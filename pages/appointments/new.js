import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { withAuth, useAuth } from '../../utils/auth';
import Head from 'next/head';

function NewAppointment() {
  const router = useRouter();
  const { user } = useAuth();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    // Parse start and end times from URL parameters
    if (router.query.start) {
      const start = new Date(router.query.start);
      setStartTime(start.toLocaleString());
    }
    
    if (router.query.end) {
      const end = new Date(router.query.end);
      setEndTime(end.toLocaleString());
    }
  }, [router.query]);

  return (
    <Layout>
      <Head>
        <title>New Appointment | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">New Appointment</h1>
          
          <button
            onClick={() => router.push('/appointments')}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Back to Calendar
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-lg text-white mb-4">
              This is a placeholder for the new appointment form
            </p>
            
            {(startTime || endTime) && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg mx-auto max-w-md">
                <h2 className="text-blue-400 font-medium mb-2">Selected Time Slot</h2>
                <p className="text-gray-300">Start: {startTime || 'Not specified'}</p>
                <p className="text-gray-300">End: {endTime || 'Not specified'}</p>
              </div>
            )}
            
            <button
              onClick={() => router.push('/appointments')}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Calendar
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(NewAppointment); 