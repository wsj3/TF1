import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <main className="flex flex-col items-center justify-center w-full text-center">
        <h1 className="text-xl font-bold text-center">
          Therapists Friend
        </h1>
        <p className="mt-2">
          A comprehensive practice management application
        </p>
        <div className="mt-4">
          {new Date().toLocaleString()}
        </div>
      </main>
    </div>
  );
} 