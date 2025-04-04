import { useAuth } from '../utils/auth';
import { useState } from 'react';
import Link from 'next/link';

export default function CustomTopNav() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Toggle dropdown menu
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  return (
    <nav className="fixed top-0 right-0 left-64 h-16 bg-gray-800 flex items-center justify-between px-4 shadow-md z-10">
      <div className="flex-1">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* About and Help links */}
          <Link href="/about" className="text-gray-300 hover:text-white text-sm">
            About
          </Link>
          <Link href="/help" className="text-gray-300 hover:text-white text-sm">
            Help
          </Link>
        </div>
      </div>
      
      {/* Right section - User profile and settings */}
      <div className="flex items-center">
        {/* Notifications */}
        <button
          type="button"
          className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none"
        >
          <span className="sr-only">View notifications</span>
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Profile dropdown */}
        <div className="ml-3 relative">
          <div>
            <button
              type="button"
              className="max-w-xs rounded-full flex items-center text-sm focus:outline-none"
              id="user-menu"
              aria-expanded="false"
              aria-haspopup="true"
              onClick={toggleDropdown}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="ml-2 text-white">{user?.name || 'User'}</span>
              <svg
                className="ml-2 h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu"
            >
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                role="menuitem"
              >
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                role="menuitem"
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 