import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';

export default function Home() {
  const { data: session } = useSession();

  return (
    <Layout title="Home | Therapists Friend">
      <div className="min-h-screen bg-white">
        <main>
          <div className="pt-10 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
            <div className="mx-auto max-w-7xl lg:px-8">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
                  <div className="lg:py-24">
                    <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-black sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                      <span className="block">Therapists Friend</span>
                      <span className="block text-indigo-600">Practice Management Made Simple</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                      A comprehensive solution for managing your therapy practice, from scheduling to documentation.
                    </p>
                    <div className="mt-10 sm:mt-12">
                      {session ? (
                        <Link href="/dashboard" legacyBehavior>
                          <a className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            Go to Dashboard
                          </a>
                        </Link>
                      ) : (
                        <Link href="/auth/signin" legacyBehavior>
                          <a className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            Sign In
                          </a>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative">
                  <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                    {/* Placeholder for hero image */}
                    <div className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none">
                      <div className="h-56 w-full bg-indigo-100 rounded-lg sm:h-72 md:h-96 lg:h-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 