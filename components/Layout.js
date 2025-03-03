import Head from 'next/head';
import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ children, title = 'Therapist\'s Friend' }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Therapist's Friend - Practice Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen bg-gray-900">
        {children}
      </main>
    </div>
  );
} 