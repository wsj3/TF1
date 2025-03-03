import Layout from '../components/Layout';

export default function About() {
  return (
    <Layout title="About | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">About Therapist's Friend</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300 mb-4">
            Therapist's Friend is a comprehensive practice management solution designed specifically for mental health professionals.
          </p>
          <p className="text-gray-300 mb-4">
            Our platform helps you manage appointments, track client sessions, handle billing, and leverage AI assistance to streamline your administrative tasks.
          </p>
          <p className="text-gray-300 mb-4">
            Version 1.0.0
          </p>
          <div className="mt-6 border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p className="text-gray-300">
              For support or inquiries, please contact us at support@therapistsfriend.com
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 