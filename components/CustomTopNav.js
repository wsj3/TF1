import Link from 'next/link';
import { useAuth } from '../utils/auth';

export default function CustomTopNav() {
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-0 right-0 left-64 bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-end px-6 z-10">
      <div className="flex items-center space-x-6">
        {/* User info */}
        {user && (
          <div className="text-gray-300 mr-4">
            <span className="text-sm">{user.name}</span>
            <span className="text-xs text-gray-500 block">({user.role})</span>
          </div>
        )}
        
        <Link href="/about">
          <a className="text-gray-300 hover:text-white">About</a>
        </Link>
        <Link href="/help">
          <a className="text-gray-300 hover:text-white">Help</a>
        </Link>
        
        {user && (
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
} 