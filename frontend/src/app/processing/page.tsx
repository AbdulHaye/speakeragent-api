'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import LeadsProcessing from '@/components/LeadsProcessing';
import { getScoutStatus } from '@/lib/api';

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const speakerId = searchParams.get('speaker_id') || '';
  const speakerName = searchParams.get('name') || 'Speaker';
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!speakerId) return;
    const interval = setInterval(async () => {
      try {
        const status = await getScoutStatus(speakerId);
        if (status?.scout_status !== 'Running') {
          setDone(true);
          clearInterval(interval);
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [speakerId, router]);

  return done ? (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Leads are ready!</h2>
        <p className="text-gray-500">Redirecting to your dashboard...</p>
      </div>
    </div>
  ) : (
    <LeadsProcessing speakerName={speakerName} />
  );
}

export default function ProcessingPage() {
  return (
    <AppShell>
      <div className="p-6">
        <Suspense fallback={<LeadsProcessing speakerName="Speaker" />}>
          <ProcessingContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
