import Layout from '../components/Layout';

export default function Help() {
  return (
    <Layout title="Help | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Help Center</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-blue-400">How do I schedule a new appointment?</h3>
                <p className="text-gray-300 mt-1">
                  Navigate to the Appointments page and click the "New Appointment" button. Fill in the required information and click Save.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-400">How do I add a new client?</h3>
                <p className="text-gray-300 mt-1">
                  Go to the Clients page and click "Add Client". Complete the client profile form with all relevant information.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-400">How can I use the AI Assistant?</h3>
                <p className="text-gray-300 mt-1">
                  The AI Assistant can help with tasks like summarizing sessions, suggesting treatment approaches, and drafting session notes. Simply type your question in the AI Assistant interface.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Support</h2>
            <p className="text-gray-300">
              Need more help? Contact our support team at support@therapistsfriend.com or visit our comprehensive documentation at docs.therapistsfriend.com.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 