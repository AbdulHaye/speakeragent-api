'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext, AppState, defaultState } from '@/lib/store';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { getPersonas } from '@/lib/api';

export default function AppShell({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('sa_state');
    if (saved) {
      try {
        setStateRaw(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
    }
    setHydrated(true);
  }, []);

  const setState = useCallback((partial: Partial<AppState>) => {
    setStateRaw(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('sa_state', JSON.stringify(next));
      return next;
    });
  }, []);

  // Redirect to login if not authenticated (only after hydration)
  useEffect(() => {
    if (hydrated && !state.speakerId) {
      router.replace('/');
    }
  }, [hydrated, state.speakerId, router]);

  // Load personas when speakerId changes
  useEffect(() => {
    if (!state.speakerId) return;
    getPersonas(state.speakerId).then((data: any) => {
      const list = data.personas || data || [];
      setState({ personas: list });
      if (list.length > 0 && !state.activePersonaId) {
        setState({
          activePersonaId: list[0].id,
          activePersonaName: list[0].persona_name || 'Core Persona',
        });
      }
    }).catch(console.error);
  }, [state.speakerId]);

  // Show nothing until hydrated
  if (!hydrated) return null;
  if (!state.speakerId) return null;

  return (
    <AppContext.Provider value={{ state, setState }}>
      <div className="flex min-h-screen bg-[#fafafa]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
