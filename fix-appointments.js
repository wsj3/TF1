import React, { useState, useEffect } from 'react';
import { PrismaClient } from '@prisma/client';

// This is a server-side function that will run at build time
export async function getServerSideProps() {
  try {
    const prisma = new PrismaClient();
    
    // Get the current month's sessions
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const sessions = await prisma.session.findMany({
      where: {
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        Client: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    // Format sessions for the calendar
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: `${session.Client.firstName} ${session.Client.lastName}`,
      start: session.startTime.toISOString(),
      end: session.endTime.toISOString(),
      status: session.status
    }));
    
    await prisma.$disconnect();
    
    return {
      props: {
        sessions: formattedSessions,
        dbConnected: true,
        error: null
      }
    };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    
    return {
      props: {
        sessions: [],
        dbConnected: false,
        error: error.message
      }
    };
  }
}

export default function FixAppointments({ sessions, dbConnected, error }) {
  const [demoMode, setDemoMode] = useState(false);
  
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Appointments Diagnostic Page</h1>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Database Connection Status</h2>
        {dbConnected ? (
          <div className="text-green-400">
            <p>✅ Database connection successful</p>
            <p>Found {sessions.length} sessions for the current month</p>
          </div>
        ) : (
          <div className="text-red-400">
            <p>❌ Database connection failed</p>
            <p>Error: {error}</p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Session Data Sample</h2>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Client</th>
                  <th className="p-2 text-left">Start Time</th>
                  <th className="p-2 text-left">End Time</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 5).map(session => (
                  <tr key={session.id} className="border-t border-gray-700">
                    <td className="p-2">{session.id.substring(0, 8)}...</td>
                    <td className="p-2">{session.title}</td>
                    <td className="p-2">{new Date(session.start).toLocaleString()}</td>
                    <td className="p-2">{new Date(session.end).toLocaleString()}</td>
                    <td className="p-2">{session.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No sessions found for the current month.</p>
        )}
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Check that your database connection string is correct in <code className="bg-gray-700 px-1 rounded">.env.local</code></li>
          <li>Ensure Prisma schema is up to date with <code className="bg-gray-700 px-1 rounded">npx prisma generate</code></li>
          <li>Verify that the database has been seeded with <code className="bg-gray-700 px-1 rounded">npx prisma db seed</code></li>
          <li>Check for JavaScript errors in the browser console</li>
          <li>Try using demo mode if database connection is failing</li>
        </ol>
      </div>
      
      <div className="flex space-x-4">
        <a 
          href="/appointments" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Appointments
        </a>
        
        <a 
          href="/appointments?demo=true" 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Use Demo Mode
        </a>
        
        <a 
          href="/" 
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
} 