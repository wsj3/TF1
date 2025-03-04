import Link from 'next/link';
import { useAuth } from '../utils/auth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center fixed top-0 right-0 left-64 z-10">
      <div className="flex justify-between items-center w-full px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8 mr-2" />
            <h1 className="text-xl font-bold text-white">Therapist's Friend</h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link href="/about" className="text-gray-300 hover:text-white">
            About
          </Link>
          
          <Link href="/help" className="text-gray-300 hover:text-white">
            Help
          </Link>
          
          {user ? (
            <button 
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </button>
          ) : (
            <Link href="/auth/simple-signin" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 