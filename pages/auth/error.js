import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Authentication error page
export default function Error() {
  const router = useRouter();
  const { error } = router.query;
  
  // Define user-friendly error messages
  const errorMessages = {
    default: "An error occurred during authentication",
    CredentialsSignin: "Invalid email or password. Please try again.",
    SessionRequired: "You need to be signed in to access this page",
    AccessDenied: "You don't have permission to access this page",
  };
  
  // Get the appropriate error message or use default
  const errorMessage = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Authentication Error | Therapist's Friend</title>
      </Head>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Authentication Error
          </h2>
        </div>

        <div className="bg-red-900 border border-red-800 text-white px-4 py-3 rounded relative mt-8" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>

        <div className="flex flex-col space-y-4 mt-8">
          <Link href="/auth/signin" className="w-full">
            <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Return to Sign In
            </button>
          </Link>
          
          <Link href="/" className="w-full">
            <button className="group relative w-full flex justify-center py-2 px-4 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Return to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 