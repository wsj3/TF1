import React from 'react';

class AppointmentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Calendar Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You can also log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRefresh = () => {
    // Reload the page with a fresh timestamp to bypass caches
    window.location.href = `/appointments?refresh=${Date.now()}`;
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Something went wrong with the calendar</h2>
          <p className="text-gray-300 mb-4">
            There was an error loading or displaying the appointments calendar.
          </p>
          <div className="mb-6">
            <button
              onClick={this.handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Calendar
            </button>
          </div>
          {this.props.showErrorDetails && (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg text-left overflow-auto max-h-48 text-xs text-gray-400">
              <p className="font-bold mb-2">Error details (for developers):</p>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p className="mt-2">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </p>
            </div>
          )}
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default AppointmentErrorBoundary; 