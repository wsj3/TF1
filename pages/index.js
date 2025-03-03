import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';

export default function Home() {
  const { data: session } = useSession();

  return (
    <Layout title="Home | Therapist's Friend">
      {/* This is an empty center area */}
      <div className="h-full"></div>
    </Layout>
  );
} 