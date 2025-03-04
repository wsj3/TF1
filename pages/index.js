import { getSession } from "next-auth/react";
import Head from "next/head";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <Head>
        <title>Therapist's Friend</title>
        <meta name="description" content="Therapist's Friend - Practice Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          Welcome to <span className="text-blue-500">Therapist's Friend</span>
        </h1>

        <div className="flex flex-col space-y-4">
          <a
            href="/auth/signin"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            Sign In
          </a>
          
          <p className="text-gray-400 mt-4">
            The comprehensive practice management solution for therapists
          </p>
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t border-gray-800">
        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} Therapist's Friend
        </p>
      </footer>
    </div>
  );
}

// Server-side check if user is authenticated
export async function getServerSideProps(context) {
  const session = await getSession(context);

  // If the user is already authenticated, redirect to dashboard
  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
} 