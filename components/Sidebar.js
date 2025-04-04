import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../utils/auth';
import dynamic from 'next/dynamic';
import Script from 'next/script';

// Create a client-side only component for the ElevenLabs widget with error boundaries
const ElevenLabsWidget = dynamic(
  () => import('./widgets/ElevenLabsWidget'),
  { 
    ssr: false,
    loading: () => (
      <div className="p-3 bg-gray-800 rounded-md mt-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2 bg-gray-700 rounded"></div>
            <div className="h-2 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }
);

export default function Sidebar({ modules = [], selectedModuleIndex = 0, onModuleChange = () => {}, onLogout, clientInfo = null }) {
  const router = useRouter();
  const { user } = useAuth();
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [widgetError, setWidgetError] = useState(false);
  
  // Define navigation with admin check
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Tasks', href: '/tasks', icon: 'task' },
    { name: 'Clients', href: '/clients', icon: 'user' },
    { name: 'Appointments', href: '/appointments', icon: 'calendar' },
    { name: 'Sessions', href: '/sessions', icon: 'chat' },
    { name: 'Treatment Plans', href: '/treatment-plans', icon: 'treatment' },
    { name: 'Diagnoses', href: '/diagnoses', icon: 'diagnosis' },
    { name: 'Billing', href: '/billing', icon: 'billing' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ];

  // Handle script loading errors
  const handleScriptError = () => {
    console.error('Failed to load ElevenLabs widget script');
    setWidgetError(true);
  };

  const handleScriptLoad = () => {
    setWidgetLoaded(true);
  };

  // Get the final navigation items
  const getNavigationItems = () => {
    if (user?.isAdmin) {
      return [...navigation, { name: 'Admin Console', href: '/admin', icon: 'settings' }];
    }
    return navigation;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 w-64 fixed left-0 top-0">
      {/* Main sidebar content */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-xl font-semibold text-white">Therapist's Friend</span>
          </div>
          
          {/* Main navigation */}
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {getNavigationItems().map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link 
                  href={item.href} 
                  key={item.name}
                  className={`
                    group flex items-center px-2 py-2 text-base font-medium rounded-md
                    ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                >
                  <span className="mr-4">{getIcon(item.icon, isActive)}</span>
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto text-xs bg-green-700 text-white px-1 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Module buttons (if specified as props) */}
            {modules && modules.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Modules
                </h3>
                <div className="mt-1 space-y-1">
                  {modules.map((module, index) => (
                    <button
                      key={module.name}
                      onClick={() => onModuleChange(index)}
                      className={`${
                        selectedModuleIndex === index
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
                    >
                      {getIcon(module.icon, selectedModuleIndex === index)}
                      <span className="ml-3">{module.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ElevenLabs Widget */}
            <div className="mt-6" id="ai-assistant-widget">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                AI ASSISTANT
              </h3>
              
              {/* Always use the widget component regardless of environment */}
              <ElevenLabsWidget />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

// Icon rendering function
function getIcon(name, isActive) {
  const iconClasses = `mr-3 h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`;

  switch (name) {
    case 'home':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'task':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'user':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'treatment':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'diagnosis':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'billing':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
} 