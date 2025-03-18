import Head from 'next/head';
import { useAuth } from '../utils/auth';
import Sidebar from './Sidebar';
import CustomTopNav from './CustomTopNav';

export default function CustomLayout({ children, title = 'Therapist\'s Friend' }) {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Checking authentication status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Therapist's Friend - Practice Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Always show navigation when user is authenticated */}
      <Sidebar />
      <CustomTopNav />

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen bg-gray-900">
        {children}
      </main>
    </div>
  );
} 