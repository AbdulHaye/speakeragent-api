'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings, Sparkles, Check, Circle, Loader2 } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { getChecklist, completeChecklistTask } from '@/lib/api';

interface ChecklistItem {
  id: string;
  task: string;
  status: string;
  order: number;
}

export default function TopBar() {
  const { state, setState } = useAppState();
  const [showPersonas, setShowPersonas] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const personaRef = useRef<HTMLDivElement>(null);
  const checklistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) setShowPersonas(false);
      if (checklistRef.current && !checklistRef.current.contains(e.target as Node)) setShowChecklist(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchChecklist = async () => {
    if (!state.speakerId) return;
    setLoadingChecklist(true);
    try {
      const data = await getChecklist(state.speakerId);
      const items = (Array.isArray(data) ? data : data.checklist || [])
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setChecklist(items);
    } catch {
      setChecklist([]);
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleToggleChecklist = () => {
    if (!showChecklist) fetchChecklist();
    setShowChecklist(!showChecklist);
  };

  const handleComplete = async (taskName: string) => {
    setCompletingTask(taskName);
    try {
      await completeChecklistTask(state.speakerId, taskName);
      await fetchChecklist();
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingTask(null);
    }
  };

  const incomplete = checklist.filter(c => c.status !== 'Completed').length;
  const total = checklist.length || 4;

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      {/* Left */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            The Office of{' '}
            <span style={{ color: 'var(--accent)' }}>{state.speakerName || 'Speaker'}</span>
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            ALPHA
          </span>
        </div>
        <p className="text-xs text-gray-400 -mt-0.5">Speaker Command Center</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Persona selector */}
        <div ref={personaRef} className="relative">
          <button
            onClick={() => setShowPersonas(!showPersonas)}
            className="flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm hover:bg-gray-50 transition-colors">
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span className="font-medium">PERSONA</span>
            <span className="font-semibold">{state.activePersonaName}</span>
            <ChevronDown size={14} />
          </button>
          {showPersonas && state.personas.length > 0 && (
            <div className="absolute right-0 mt-1 w-56 bg-white border rounded-lg shadow-lg py-1 z-50">
              {state.personas.map((p: any) => (
                <button key={p.id}
                  onClick={() => {
                    setState({
                      activePersonaId: p.id,
                      activePersonaName: p.persona_name || 'Core Persona',
                    });
                    setShowPersonas(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    state.activePersonaId === p.id ? 'font-semibold bg-gray-50' : ''
                  }`}>
                  {p.persona_name || 'Core Persona'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Setup Guide / Checklist */}
        <div ref={checklistRef} className="relative">
          <button onClick={handleToggleChecklist}
            className="flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm hover:bg-gray-50">
            <Settings size={14} />
            <span>Setup Guide</span>
            <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
              incomplete === 0 ? 'bg-green-500 text-white' : 'bg-gray-900 text-white'
            }`}>
              {checklist.length > 0 ? incomplete : '4'}
            </span>
          </button>

          {showChecklist && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-bold">Setup Guide</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {incomplete === 0 ? 'All done!' : `${total - incomplete} of ${total} completed`}
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${checklist.length > 0 ? ((total - incomplete) / total) * 100 : 0}%` }} />
                </div>
              </div>

              {loadingChecklist ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-gray-400" />
                </div>
              ) : checklist.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">No checklist items found</div>
              ) : (
                <div className="py-1">
                  {checklist.map((item) => {
                    const done = item.status === 'Completed';
                    const completing = completingTask === item.task;
                    return (
                      <button key={item.id}
                        onClick={() => !done && handleComplete(item.task)}
                        disabled={done || completing}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          done ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
                        }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          done ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {completing ? (
                            <Loader2 size={10} className="animate-spin text-gray-400" />
                          ) : done ? (
                            <Check size={12} className="text-white" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                            {item.task}
                          </span>
                        </div>
                        {!done && !completing && (
                          <span className="text-[10px] text-blue-600 font-medium shrink-0">Mark done</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
