import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';
import Head from 'next/head';

function Settings() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [knowledgeBaseExpanded, setKnowledgeBaseExpanded] = useState(false);
  const [aiAssistantExpanded, setAiAssistantExpanded] = useState(false);
  const [aiGuidanceExpanded, setAiGuidanceExpanded] = useState(false);
  
  // Color scheme options
  const [colorScheme, setColorScheme] = useState('Dark Theme');
  
  // Security settings
  const [twoFactor, setTwoFactor] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);
  
  // Permission settings
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(true);
  
  // Knowledge base settings
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);
  const [searchStrategy, setSearchStrategy] = useState('Semantic Search');
  
  // AI Assistant settings
  const [interfaceType, setInterfaceType] = useState('Text Interface');
  const [preferredVoice, setPreferredVoice] = useState('System Default');
  const [speechRate, setSpeechRate] = useState(50);
  const [accuracyTemperature, setAccuracyTemperature] = useState(30);
  const [humanAvatarEnabled, setHumanAvatarEnabled] = useState(true);
  const [humanAvatarStyle, setHumanAvatarStyle] = useState('Emoji');
  
  // AI Guidance settings
  const [googleSheetEnabled, setGoogleSheetEnabled] = useState(true);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetLoaded, setGoogleSheetLoaded] = useState(false);
  const [guidanceTypes, setGuidanceTypes] = useState({
    mentor: true,
    scientist: false,
    friend: false,
    assistant: true,
    peer: false
  });
  const [availableSheets, setAvailableSheets] = useState([
    { name: 'Client Information', display: true, rows: 12 },
    { name: 'Treatment Protocols', display: true, rows: 24 },
    { name: 'Diagnostic Codes', display: true, rows: 42 },
    { name: 'Billing Reference', display: false, rows: 18 }
  ]);
  
  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load all settings from localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        // Load AI Assistant settings
        const savedInterfaceType = localStorage.getItem('aiInterfaceType');
        const savedVoice = localStorage.getItem('preferredVoice');
        const savedSpeechRate = localStorage.getItem('speechRate');
        const savedTemperature = localStorage.getItem('aiTemperature');
        const savedHumanAvatarEnabled = localStorage.getItem('humanAvatarEnabled');
        const savedHumanAvatarStyle = localStorage.getItem('humanAvatarStyle');
        const savedGuidanceTypes = localStorage.getItem('guidanceTypes');
        
        if (savedInterfaceType) setInterfaceType(savedInterfaceType);
        if (savedVoice) setPreferredVoice(savedVoice);
        if (savedSpeechRate) setSpeechRate(parseInt(savedSpeechRate));
        if (savedTemperature) setAccuracyTemperature(parseInt(savedTemperature));
        if (savedHumanAvatarEnabled !== null) setHumanAvatarEnabled(savedHumanAvatarEnabled === 'true');
        if (savedHumanAvatarStyle) setHumanAvatarStyle(savedHumanAvatarStyle);
        if (savedGuidanceTypes) setGuidanceTypes(JSON.parse(savedGuidanceTypes));

        // Load Google Sheet URL
        const envGoogleSheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || '';
        if (envGoogleSheetUrl) {
          setGoogleSheetUrl(envGoogleSheetUrl);
          setGoogleSheetLoaded(true);
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      }
    }
  }, [mounted]);

  // Save settings to localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        // Save AI Assistant settings
        localStorage.setItem('aiInterfaceType', interfaceType);
        localStorage.setItem('preferredVoice', preferredVoice);
        localStorage.setItem('speechRate', speechRate.toString());
        localStorage.setItem('aiTemperature', accuracyTemperature.toString());
        localStorage.setItem('humanAvatarEnabled', humanAvatarEnabled.toString());
        localStorage.setItem('humanAvatarStyle', humanAvatarStyle);
        localStorage.setItem('guidanceTypes', JSON.stringify(guidanceTypes));
        
        // Save voice settings for compatibility
        const voiceSettings = { voice: preferredVoice, rate: speechRate };
        localStorage.setItem('aiVoiceSettings', JSON.stringify(voiceSettings));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    }
  }, [mounted, interfaceType, preferredVoice, speechRate, accuracyTemperature, humanAvatarEnabled, humanAvatarStyle, guidanceTypes]);
  
  // Function to toggle sheet display
  const toggleSheetDisplay = (index) => {
    const updatedSheets = [...availableSheets];
    updatedSheets[index].display = !updatedSheets[index].display;
    setAvailableSheets(updatedSheets);
  };
  
  // Toggle section expansion
  const toggleGeneral = () => setGeneralExpanded(!generalExpanded);
  const toggleKnowledgeBase = () => setKnowledgeBaseExpanded(!knowledgeBaseExpanded);
  const toggleAiAssistant = () => setAiAssistantExpanded(!aiAssistantExpanded);
  const toggleAiGuidance = () => setAiGuidanceExpanded(!aiGuidanceExpanded);

  // Update guidance type selection
  const handleGuidanceTypeChange = (type) => {
    setGuidanceTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Settings | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
        
        {/* General Settings Section */}
        <div className="bg-gray-800 rounded-lg mb-6 overflow-hidden">
          <button 
            className="w-full flex justify-between items-center p-4 text-white font-medium border-b border-gray-700"
            onClick={toggleGeneral}
          >
            <span className="text-lg">General Settings</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform ${generalExpanded ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {generalExpanded && (
            <div className="p-4">
              {/* Color Scheme */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-2">Color Scheme</h3>
                <select 
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                  className="w-full bg-gray-700 border-0 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option>Dark Theme</option>
                  <option>Light Theme</option>
                  <option>System Default</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">Choose your preferred color scheme for the application.</p>
              </div>
              
              {/* Security */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="twoFactor" 
                      checked={twoFactor}
                      onChange={() => setTwoFactor(!twoFactor)}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="twoFactor" className="ml-2 text-gray-300">
                      Enable Two-Factor Authentication
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="autoLogout" 
                      checked={autoLogout}
                      onChange={() => setAutoLogout(!autoLogout)}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="autoLogout" className="ml-2 text-gray-300">
                      Auto-logout after inactivity
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Permissions */}
              <div>
                <h3 className="text-white font-medium mb-3">Permissions</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="desktopNotifications" 
                      checked={desktopNotifications}
                      onChange={() => setDesktopNotifications(!desktopNotifications)}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="desktopNotifications" className="ml-2 text-gray-300">
                      Allow Desktop Notifications
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="shareAnalytics" 
                      checked={shareAnalytics}
                      onChange={() => setShareAnalytics(!shareAnalytics)}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="shareAnalytics" className="ml-2 text-gray-300">
                      Share Analytics Data
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Assistant Settings Section */}
        <div className="bg-gray-800 rounded-lg mb-6 overflow-hidden">
          <button 
            className="w-full flex justify-between items-center p-4 text-white font-medium border-b border-gray-700"
            onClick={toggleAiAssistant}
          >
            <span className="text-lg">AI Assistant Settings</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform ${aiAssistantExpanded ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {aiAssistantExpanded && (
            <div className="p-4">
              {/* Interface Type */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-2">Interface Type</h3>
                <select 
                  value={interfaceType}
                  onChange={(e) => setInterfaceType(e.target.value)}
                  className="w-full bg-gray-700 border-0 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option>Text Interface</option>
                  <option>Voice Interface</option>
                  <option>Avatar Interface</option>
                  <option>Hybrid Interface</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">Choose how the AI Assistant appears in conversations.</p>
              </div>
              
              {/* Human Avatar Settings - only show if using avatar or hybrid interface */}
              {(interfaceType === 'Avatar Interface' || interfaceType === 'Hybrid Interface') && (
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-2">Human Avatar</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300 text-sm">Enable Human Avatar</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={humanAvatarEnabled}
                        onChange={() => setHumanAvatarEnabled(!humanAvatarEnabled)}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                  
                  {humanAvatarEnabled && (
                    <>
                      <h4 className="text-gray-300 text-sm mb-2">Avatar Style</h4>
                      <select 
                        value={humanAvatarStyle}
                        onChange={(e) => setHumanAvatarStyle(e.target.value)}
                        className="w-full bg-gray-700 border-0 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                      >
                        <option>Emoji</option>
                        <option>Animated</option>
                        <option>Photo-Realistic</option>
                      </select>
                      <p className="text-sm text-gray-400 mt-1">Select how your avatar will appear during conversations.</p>
                    </>
                  )}
                </div>
              )}
              
              {/* Voice Settings */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-2">Voice Settings</h3>
                <h4 className="text-gray-300 text-sm mb-2">Preferred Voice</h4>
                <select 
                  value={preferredVoice}
                  onChange={(e) => setPreferredVoice(e.target.value)}
                  className="w-full bg-gray-700 border-0 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
                >
                  <option>System Default</option>
                  <option>Female Voice 1</option>
                  <option>Female Voice 2</option>
                  <option>Male Voice 1</option>
                  <option>Male Voice 2</option>
                </select>
                
                <h4 className="text-gray-300 text-sm mb-2">Speech Rate</h4>
                <div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Slower</span>
                    <span>Normal</span>
                    <span>Faster</span>
                  </div>
                </div>
              </div>
              
              {/* Accuracy Temperature */}
              <div>
                <h3 className="text-white font-medium mb-2">Accuracy Temperature</h3>
                <div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={accuracyTemperature}
                    onChange={(e) => setAccuracyTemperature(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>More Precise</span>
                    <span>Balanced</span>
                    <span>More Creative</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Lower values provide more deterministic, focused responses. Higher values allow more creativity and variation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Knowledge Base Settings Section */}
        <div className="bg-gray-800 rounded-lg mb-6 overflow-hidden">
          <button 
            className="w-full flex justify-between items-center p-4 text-white font-medium border-b border-gray-700"
            onClick={toggleKnowledgeBase}
          >
            <span className="text-lg">Knowledge Base Settings</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform ${knowledgeBaseExpanded ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {knowledgeBaseExpanded && (
            <div className="p-4">
              {/* Knowledge Base Integration */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <input 
                    type="checkbox" 
                    id="knowledgeBaseEnabled" 
                    checked={knowledgeBaseEnabled}
                    onChange={() => setKnowledgeBaseEnabled(!knowledgeBaseEnabled)}
                    className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <label htmlFor="knowledgeBaseEnabled" className="ml-2 text-white font-medium">
                    Enable Knowledge Base Integration
                  </label>
                </div>
                <p className="text-sm text-gray-400 ml-6">When enabled, the AI Assistant will use your knowledge base to provide more accurate responses.</p>
              </div>
              
              {/* Search Strategy */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-2">Search Strategy</h3>
                <select 
                  value={searchStrategy}
                  onChange={(e) => setSearchStrategy(e.target.value)}
                  className="w-full bg-gray-700 border-0 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option>Semantic Search</option>
                  <option>Keyword Search</option>
                  <option>Hybrid Search</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">Choose how the AI Assistant searches through your knowledge base.</p>
              </div>
              
              {/* Context Window Size */}
              <div>
                <h3 className="text-white font-medium mb-2">Context Window Size</h3>
                <div className="bg-gray-700 rounded-md w-full h-8 overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: '50%' }}></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Guidance Settings Section */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <button 
            className="w-full flex justify-between items-center p-4 text-white font-medium border-b border-gray-700"
            onClick={toggleAiGuidance}
          >
            <span className="text-lg">AI Guidance Settings</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform ${aiGuidanceExpanded ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {aiGuidanceExpanded && (
            <div className="p-4">
              {/* Guidance Type Selection */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Determine How Your Assistant Should Engage</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="guidanceMentor" 
                      checked={guidanceTypes.mentor}
                      onChange={() => handleGuidanceTypeChange('mentor')}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="guidanceMentor" className="ml-2 text-gray-300">
                      Mentor
                    </label>
                    <span className="ml-2 text-xs text-gray-500">(Provides guidance and wisdom)</span>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="guidanceScientist" 
                      checked={guidanceTypes.scientist}
                      onChange={() => handleGuidanceTypeChange('scientist')}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="guidanceScientist" className="ml-2 text-gray-300">
                      Scientist
                    </label>
                    <span className="ml-2 text-xs text-gray-500">(Focuses on evidence and research)</span>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="guidanceFriend" 
                      checked={guidanceTypes.friend}
                      onChange={() => handleGuidanceTypeChange('friend')}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="guidanceFriend" className="ml-2 text-gray-300">
                      Friend
                    </label>
                    <span className="ml-2 text-xs text-gray-500">(Warm, empathetic, and supportive)</span>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="guidanceAssistant" 
                      checked={guidanceTypes.assistant}
                      onChange={() => handleGuidanceTypeChange('assistant')}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="guidanceAssistant" className="ml-2 text-gray-300">
                      Assistant
                    </label>
                    <span className="ml-2 text-xs text-gray-500">(Task-oriented and efficient)</span>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="guidancePeer" 
                      checked={guidanceTypes.peer}
                      onChange={() => handleGuidanceTypeChange('peer')}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="guidancePeer" className="ml-2 text-gray-300">
                      Peer
                    </label>
                    <span className="ml-2 text-xs text-gray-500">(Collaborates as a professional equal)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-3">Select one or more roles to shape how the AI interacts with you in conversations.</p>
              </div>
              
              {/* Google Sheet Integration */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <input 
                    type="checkbox" 
                    id="googleSheetEnabled" 
                    checked={googleSheetEnabled}
                    onChange={() => setGoogleSheetEnabled(!googleSheetEnabled)}
                    className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <label htmlFor="googleSheetEnabled" className="ml-2 text-white font-medium">
                    Enable Google Sheet Integration
                  </label>
                </div>
                <p className="text-sm text-gray-400 ml-6">When enabled, the AI will use reference data from the configured Google Sheets.</p>
              </div>
              
              {/* Google Sheet Connection & Sheet Display Settings */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-2">Google Sheet Connection</h3>
                <div className="bg-gray-700 rounded-md p-3 text-sm text-gray-300 break-all">
                  {googleSheetLoaded ? (
                    <>
                      <div className="flex items-center text-green-400 mb-2">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Connected
                      </div>
                      <p className="text-xs">{googleSheetUrl.substring(0, 40)}...</p>
                    </>
                  ) : (
                    <div className="text-yellow-400">
                      <p>No Google Sheet configured. Check .env.local file.</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1 mb-3">The Google Sheet connection is configured in your environment variables.</p>
                
                {/* Available Sheets Display Controls */}
                {googleSheetLoaded && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Available Sheets</h4>
                    <div className="space-y-2">
                      {availableSheets.map((sheet, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id={`sheet-${index}`}
                              checked={sheet.display}
                              onChange={() => toggleSheetDisplay(index)}
                              className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700 mr-2"
                            />
                            <label htmlFor={`sheet-${index}`} className="text-gray-300">
                              {sheet.name}
                            </label>
                          </div>
                          <span className="text-xs text-gray-400">{sheet.rows} rows</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sync Settings */}
              <div>
                <h3 className="text-white font-medium mb-2">Sync Settings</h3>
                <select 
                  className="w-full bg-gray-700 border-0 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
                  defaultValue="manual"
                >
                  <option value="manual">Manual Sync</option>
                  <option value="daily">Daily Sync</option>
                  <option value="hourly">Hourly Sync</option>
                </select>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full">
                  Sync Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Export the wrapped component
export default withAuth(Settings); 