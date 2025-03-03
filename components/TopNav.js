import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function TopNav() {
  const { data: session } = useSession();

  return (
    <div className="fixed top-0 right-0 left-64 bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-end px-6">
      <div className="flex items-center space-x-6">
        <Link href="/about">
          <span className="text-gray-300 hover:text-white">About</span>
        </Link>
        <Link href="/help">
          <span className="text-gray-300 hover:text-white">Help</span>
        </Link>
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
} 