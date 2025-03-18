import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const errors = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have access to this resource.",
  Verification: "The verification link was invalid or has expired.",
  default: "An unexpected error occurred."
};

// Authentication error page
export default function Error() {
  const router = useRouter();
  const { error } = router.query;
  
  const errorMessage = error && (errors[error] ?? errors.default);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Error | Therapist's Friend</title>
      </Head>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-red-400">
            {errorMessage}
          </p>
        </div>
        
        <div className="rounded-md bg-gray-800 p-6 shadow-md">
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              There was a problem signing you in. Please try again.
            </p>
            
            <Link href="/auth/signin" legacyBehavior>
              <a className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Return to Sign In
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 