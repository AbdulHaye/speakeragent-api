'use client';

import { createContext, useContext } from 'react';

export interface AppState {
  speakerId: string;
  speakerName: string;
  activePersonaId: string;
  activePersonaName: string;
  personas: any[];
  plan: string;
}

export const defaultState: AppState = {
  speakerId: '',
  speakerName: '',
  activePersonaId: '',
  activePersonaName: 'Core Persona',
  personas: [],
  plan: 'Free',
};

export const AppContext = createContext<{
  state: AppState;
  setState: (s: Partial<AppState>) => void;
}>({ state: defaultState, setState: () => {} });

export const useAppState = () => useContext(AppContext);
