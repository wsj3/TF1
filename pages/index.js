import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  return (
    <div style={{ 
      padding: 20,
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: 1.5
    }}>
      <h1 style={{ color: '#333', fontSize: '2rem' }}>Therapist's Friend - Pages Router</h1>
      <p>This is a simple page with inline styles and no external dependencies.</p>
      <p>Current time: {new Date().toISOString()}</p>
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
        <h2 style={{ fontSize: '1.5rem', marginTop: 0 }}>Environment Info</h2>
        <p>Node Environment: {process.env.NODE_ENV || 'Not set'}</p>
        <p>NextAuth URL: {process.env.NEXTAUTH_URL ? 'Set' : 'Not set'}</p>
        <p>Database URL: {process.env.DATABASE_URL ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  );
} 