import Link from 'next/link';
import Layout from '../components/Layout';

export default function Custom404() {
  return (
    <Layout title="404 - Page Not Found | Therapists Friend">
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="text-6xl font-bold text-indigo-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="mt-2 text-gray-600">Sorry, we couldn't find the page you're looking for.</p>
        <div className="mt-6">
          <Link href="/" legacyBehavior>
            <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Go back home
            </a>
          </Link>
        </div>
      </div>
    </Layout>
  );
} 