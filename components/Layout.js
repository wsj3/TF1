import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';

export default function Layout({ children, title = 'Therapists Friend' }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Clients', href: '/clients' },
    { name: 'Sessions', href: '/sessions' },
    { name: 'Notes', href: '/notes' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Therapists Friend - Practice Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" legacyBehavior>
                  <a className="text-xl font-bold text-indigo-600">Therapists Friend</a>
                </Link>
              </div>
              {status === 'authenticated' && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <Link key={item.name} href={item.href} legacyBehavior>
                        <a
                          className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                            isActive
                              ? 'border-indigo-500 text-gray-900'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {item.name}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {status === 'authenticated' ? (
                <div className="flex items-center">
                  <Link href="/profile" legacyBehavior>
                    <a className="p-1 rounded-full text-gray-400 hover:text-gray-500 mr-4">
                      <span className="sr-only">Profile</span>
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </a>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link href="/auth/signin" legacyBehavior>
                  <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Sign in
                  </a>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} Therapists Friend. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 