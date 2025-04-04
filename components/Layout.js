import Head from 'next/head';
import { useAuth } from '../utils/auth';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ children, title = 'Therapist\'s Friend' }) {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Therapist's Friend - Practice Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Top Navigation - Always show */}
      <TopNav />

      {/* Sidebar Navigation - Only show when authenticated */}
      {isAuthenticated && <Sidebar />}

      {/* Main Content */}
      <main className={`${isAuthenticated ? "ml-64" : ""} pt-16 min-h-screen bg-gray-900 relative`}>
        {children}
      </main>

      <style jsx global>{`
        /* Ensure proper stacking context */
        nav {
          z-index: 50;
        }
        
        aside {
          z-index: 40;
        }
        
        main {
          z-index: 1;
        }
        
        /* Fix any potential overflow issues */
        .fc-view-harness {
          background-color: #1a202c;
        }
        
        /* Ensure calendar buttons are above other elements */
        .fc-header-toolbar {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </div>
  );
} 