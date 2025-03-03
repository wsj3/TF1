import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { withSession } from '../components/SessionWrapper';

function AIAssistant() {
  const { data: session } = useSession();

  return (
    <Layout title="AI Assistant | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">AI Assistant</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300">AI Assistant interface will go here.</p>
          <div className="mt-4 bg-gray-700 p-4 rounded-lg">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <p className="text-white text-sm">How can I help you today?</p>
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withSession(AIAssistant, { requireAuth: true }); 