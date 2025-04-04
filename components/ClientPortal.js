import { useState, useEffect } from 'react';
import { verifySessionToken } from '../utils/security';
import { validateHIPAACompliance } from '../utils/hipaaUtils';

const ClientPortal = ({ clientId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clientData, setClientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify client authentication on mount
  useEffect(() => {
    verifyClientAuth();
  }, []);

  // Load client data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadClientData();
    }
  }, [isAuthenticated]);

  // Verify client authentication
  const verifyClientAuth = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const userData = await verifySessionToken(token);
      if (userData.role !== 'client' || userData.clientId !== clientId) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Load client data
  const loadClientData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clientToken');

      // Load appointments
      const appointmentsResponse = await fetch('/api/clients/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!appointmentsResponse.ok) throw new Error('Failed to load appointments');
      const appointmentsData = await appointmentsResponse.json();
      setAppointments(appointmentsData.appointments);

      // Load documents
      const documentsResponse = await fetch('/api/clients/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!documentsResponse.ok) throw new Error('Failed to load documents');
      const documentsData = await documentsResponse.json();
      setDocuments(documentsData.documents);

      // Load messages
      const messagesResponse = await fetch('/api/clients/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!messagesResponse.ok) throw new Error('Failed to load messages');
      const messagesData = await messagesResponse.json();
      setMessages(messagesData.messages);

      setClientData({
        appointments: appointmentsData.appointments,
        documents: documentsData.documents,
        messages: messagesData.messages
      });
    } catch (error) {
      console.error('Error loading client data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle appointment scheduling
  const handleScheduleAppointment = async (appointmentData) => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await fetch('/api/clients/appointments/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) throw new Error('Failed to schedule appointment');
      
      // Refresh appointments
      loadClientData();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      setError(error.message);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (file) => {
    try {
      const token = localStorage.getItem('clientToken');
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/clients/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload document');
      
      // Refresh documents
      loadClientData();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.message);
    }
  };

  // Handle sending message
  const handleSendMessage = async (message) => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await fetch('/api/clients/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      // Refresh messages
      loadClientData();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access the client portal.</div>;
  }

  return (
    <div className="client-portal">
      <nav className="portal-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'appointments' ? 'active' : ''}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
        <button 
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button 
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
      </nav>

      <main className="portal-content">
        {error && <div className="error-message">{error}</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Welcome to Your Client Portal</h2>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Upcoming Appointments</h3>
                <ul>
                  {appointments
                    .filter(apt => new Date(apt.date) > new Date())
                    .slice(0, 3)
                    .map(apt => (
                      <li key={apt.id}>
                        {new Date(apt.date).toLocaleDateString()} - {apt.time}
                      </li>
                    ))}
                </ul>
              </div>
              <div className="dashboard-card">
                <h3>Recent Documents</h3>
                <ul>
                  {documents.slice(0, 3).map(doc => (
                    <li key={doc.id}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="dashboard-card">
                <h3>Recent Messages</h3>
                <ul>
                  {messages.slice(0, 3).map(msg => (
                    <li key={msg.id}>
                      {msg.content.substring(0, 50)}...
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="appointments">
            <h2>Appointments</h2>
            <div className="appointment-scheduler">
              <h3>Schedule New Appointment</h3>
              {/* Add appointment scheduling form here */}
            </div>
            <div className="appointment-list">
              <h3>Your Appointments</h3>
              <ul>
                {appointments.map(apt => (
                  <li key={apt.id}>
                    <div className="appointment-details">
                      <span className="date">
                        {new Date(apt.date).toLocaleDateString()}
                      </span>
                      <span className="time">{apt.time}</span>
                      <span className="status">{apt.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents">
            <h2>Documents</h2>
            <div className="document-upload">
              <h3>Upload Document</h3>
              {/* Add document upload form here */}
            </div>
            <div className="document-list">
              <h3>Your Documents</h3>
              <ul>
                {documents.map(doc => (
                  <li key={doc.id}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      {doc.name}
                    </a>
                    <span className="date">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages">
            <h2>Messages</h2>
            <div className="message-list">
              {messages.map(msg => (
                <div key={msg.id} className="message">
                  <div className="message-content">{msg.content}</div>
                  <div className="message-meta">
                    <span className="date">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                    <span className="sender">{msg.sender}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="message-compose">
              <h3>Send Message</h3>
              {/* Add message composition form here */}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPortal; 