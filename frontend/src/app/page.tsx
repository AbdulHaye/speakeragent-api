'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authLogin } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const data = await authLogin(email.trim(), password);
      localStorage.setItem('sa_state', JSON.stringify({
        speakerId: data.speaker_id,
        speakerName: data.full_name,
        activePersonaId: '',
        activePersonaName: 'Core Persona',
        personas: [],
        plan: data.plan || 'Free',
      }));
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-8 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Login to your account</h2>

      {justRegistered && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          Account created successfully! Your Scout is being activated. Please login to continue.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
          <input type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com" required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1e40af' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-xs text-gray-400 text-center mt-4">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-blue-600 hover:underline font-medium">Build Your Speaker Profile</a>
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f0eb' }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
            style={{ background: 'var(--accent)' }}>SA</div>
          <h1 className="text-3xl font-bold">SpeakerAgent.ai</h1>
          <p className="text-gray-500 mt-1">AI-Powered Speaking Opportunity Scout</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl border p-8 shadow-sm text-center text-gray-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
