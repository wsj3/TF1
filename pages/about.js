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
          
          <div className="mt-6 border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Our Mission</h2>
            <p className="text-gray-300 mb-4">
              As a non-profit organization, our mission is to improve therapeutic outcomes by making advanced AI technology accessible to mental health professionals of all practice sizes. We believe that by augmenting clinical expertise with data-driven insights, we can enhance the quality of care and accelerate client progress.
            </p>
            <p className="text-gray-300 mb-4">
              The revenue generated from our platform is reinvested into research and development of new AI tools specifically designed for mental health applications, and to provide subsidized access to underserved communities and practitioners.
            </p>
          </div>

          <div className="mt-6 border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Our Approach</h2>
            <p className="text-gray-300 mb-4">
              We integrate AI technology at key points in the therapeutic process where it can have the most significant impact:
            </p>
            <ul className="list-disc pl-5 text-gray-300 space-y-1 mb-4">
              <li>Creating evidence-based treatment plans tailored to client needs</li>
              <li>Suggesting relevant interventions backed by current clinical research</li>
              <li>Tracking treatment progress with sophisticated visualization tools</li>
              <li>Reducing administrative burden to allow more focus on client care</li>
            </ul>
            <p className="text-gray-300">
              Our AI systems are designed to augment clinical judgment, not replace it. All suggestions are transparent, explainable, and supported by references to relevant clinical literature.
            </p>
          </div>

          <div className="mt-6 border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Our Features</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Client Management</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                <li>Comprehensive client profiles with clinical history</li>
                <li>Secure document management and client messaging</li>
                <li>Appointment history and session tracking</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Scheduling & Calendar</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                <li>Intuitive calendar with customizable appointment types</li>
                <li>Color-coded appointments for quick visual identification</li>
                <li>Time zone-aware scheduling to prevent booking errors</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Treatment Planning</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                <li>Evidence-based treatment plan templates for common conditions</li>
                <li>AI-powered treatment suggestions based on client presentation</li>
                <li>Progress tracking with visualization tools and reports</li>
                <li>Goal setting with measurable objectives and interventions</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">AI Assistance</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                <li>AI-powered clinical documentation suggestions</li>
                <li>Treatment planning with evidence-based interventions</li>
                <li>Practice insights with data analytics</li>
              </ul>
            </div>
          </div>
          
          <p className="text-gray-300 mb-4 mt-6">
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