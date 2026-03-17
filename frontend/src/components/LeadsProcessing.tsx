'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  { label: 'Scanning conferences & events...', icon: Search, duration: 15000 },
  { label: 'Matching your expertise to opportunities...', icon: Users, duration: 20000 },
  { label: 'Generating personalized pitches...', icon: Sparkles, duration: 25000 },
  { label: 'Verifying & ranking leads...', icon: CheckCircle2, duration: 10000 },
];

interface LeadsProcessingProps {
  onComplete?: () => void;
  speakerName?: string;
}

export default function LeadsProcessing({ onComplete, speakerName }: LeadsProcessingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 100);
      setProgress(prev => {
        const target = Math.min(95, ((currentStep + 1) / STEPS.length) * 100);
        return prev + (target - prev) * 0.02;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentStep]);

  useEffect(() => {
    const totalBeforeCurrent = STEPS.slice(0, currentStep).reduce((s, step) => s + step.duration, 0);
    const currentDuration = STEPS[currentStep]?.duration || 10000;
    if (elapsed - totalBeforeCurrent > currentDuration && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [elapsed, currentStep]);

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-lg text-center">
        {/* Animated logo */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin-slow" />
          <div className="absolute inset-3 rounded-full bg-blue-50 flex items-center justify-center">
            <Search size={28} className="text-blue-500" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Your leads are being prepared</h2>
        <p className="text-gray-500 mb-8">Estimated time: 2–5 minutes</p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>

        {/* Steps */}
        <div className="space-y-3 text-left max-w-sm mx-auto">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;

            return (
              <div key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                  isActive ? 'bg-blue-50 animate-fade-in-up' :
                  isDone ? 'opacity-60' : 'opacity-30'
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isDone ? 'bg-green-100' :
                  isActive ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {isDone ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : isActive ? (
                    <Loader2 size={16} className="text-blue-500 animate-spin" />
                  ) : (
                    <Icon size={16} className="text-gray-400" />
                  )}
                </div>
                <span className={`text-sm ${isActive ? 'font-semibold text-blue-700' : isDone ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timer */}
        <div className="mt-8 text-xs text-gray-400">
          Elapsed: {minutes}:{seconds.toString().padStart(2, '0')}
        </div>

        {speakerName && (
          <p className="mt-4 text-sm text-gray-400">
            Scouting opportunities for <span className="font-medium text-gray-600">{speakerName}</span>
          </p>
        )}
      </div>
    </div>
  );
}
