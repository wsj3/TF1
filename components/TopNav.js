import Link from 'next/link';
import { useAuth } from '../utils/auth';

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-0 right-0 left-64 bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-end px-6">
      <div className="flex items-center space-x-6">
        <Link href="/about" className="text-gray-300 hover:text-white">
          About
        </Link>
        <Link href="/help" className="text-gray-300 hover:text-white">
          Help
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