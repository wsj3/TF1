import { useRouter } from 'next/router';
import { useEffect } from 'react';

// This file ensures proper routing to the main appointments page
export default function AppointmentsIndex() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main appointments page
    router.replace('/appointments');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white">Loading appointments...</div>
    </div>
  );
} 