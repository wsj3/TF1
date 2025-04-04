import Link from 'next/link';
import { useAuth } from '../utils/auth';
import { useRouter } from 'next/router';

export default function TopNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isAuthPage = router.pathname.startsWith('/auth/');

  return (
    <nav className={`fixed top-0 ${user ? 'right-0 left-64' : 'right-0 left-0'} bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-between px-6 z-50`}>
      {/* Left side */}
      <div className="flex items-center">
        {!user && !isAuthPage && (
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign In
          </Link>
        )}
        {user && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {user.name || user.email}
            </span>
            <span className="text-gray-500 text-sm">
              ({user.isAdmin ? 'ADMIN' : user.role?.toUpperCase() || 'THERAPIST'})
            </span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-6">
        <Link href="/help" className="text-gray-300 hover:text-white text-sm">
          Help
        </Link>
        <Link href="/about" className="text-gray-300 hover:text-white text-sm">
          About
        </Link>
        {user && (
          <button
            onClick={() => {
              logout();
              router.push('/auth/signin');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
} 