'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VolunteerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-6">
      <div className="glass-card rounded-2xl p-6 text-center max-w-md">
        <h1 className="text-xl font-semibold text-white">Volunteer Flow Moved</h1>
        <p className="mt-2 text-sm text-white/50">
          Volunteering is now handled from the student experience as an event option instead of a separate dashboard.
        </p>
      </div>
    </div>
  );
}
