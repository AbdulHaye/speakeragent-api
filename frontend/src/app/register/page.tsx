'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authRegister } from '@/lib/api';
import {
  User, FileText, Target, CheckCircle,
  ArrowRight, ArrowLeft, Upload, Eye, EyeOff,
  Sparkles, Shield
} from 'lucide-react';

const STEPS = [
  { label: 'Core Persona', icon: User },
  { label: 'Speaking Topics', icon: FileText },
  { label: 'Scout Parameters', icon: Target },
  { label: 'Supporting Materials', icon: CheckCircle },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
const TIERS = ['Any', 'Local / Regional', 'National', 'International', 'Premium / Keynote'];

interface Topic {
  title: string;
  abstract: string;
  audience: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Step 1: Core Persona
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [credentials, setCredentials] = useState('');
  const [gritFactor, setGritFactor] = useState('');

  // Step 2: Speaking Topics
  const [topics, setTopics] = useState<Topic[]>([
    { title: '', abstract: '', audience: '' },
    { title: '', abstract: '', audience: '' },
    { title: '', abstract: '', audience: '' },
  ]);

  // Step 3: Scout Parameters
  const [nicheKeyword, setNicheKeyword] = useState('');
  const [conferenceYear, setConferenceYear] = useState(new Date().getFullYear());
  const [conferenceTier, setConferenceTier] = useState('Any');
  const [location, setLocation] = useState('');
  const [minHonorarium, setMinHonorarium] = useState('');

  // Step 4: Supporting Materials
  const [files, setFiles] = useState<File[]>([]);
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const updateTopic = (idx: number, field: keyof Topic, value: string) => {
    setTopics(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const validateStep = (): boolean => {
    setError('');
    if (step === 0) {
      if (!fullName.trim()) { setError('Full name is required.'); return false; }
      if (!email.trim()) { setError('Email is required.'); return false; }
      if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
      if (!bio.trim()) { setError('Professional bio is required.'); return false; }
      if (!gritFactor.trim()) { setError('Your Grit Factor is required.'); return false; }
    }
    if (step === 1) {
      if (!topics[0].title.trim()) { setError('At least one topic title is required.'); return false; }
    }
    if (step === 2) {
      if (!location.trim()) { setError('Geographic focus is required.'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setError('');
    setStep(s => Math.max(0, s - 1));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleSubmit = async () => {
    if (!agreed) { setError('Please agree to the Terms of Service.'); return; }
    setLoading(true);
    setError('');
    try {
      const validTopics = topics.filter(t => t.title.trim());
      await authRegister(fullName.trim(), email.trim(), password);

      // After account is created, redirect to login
      router.push('/?registered=true');
    } catch (err: any) {
      if (err.message.includes('409')) {
        setError('An account with this email already exists. Please login.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Now update the backend register to accept all fields - we'll send them via the existing register endpoint
  // For now, authRegister sends name+email+password, and we update persona after
  const handleSubmitFull = async () => {
    if (!agreed) { setError('Please agree to the Terms of Service.'); return; }
    setLoading(true);
    setError('');
    try {
      const validTopics = topics.filter(t => t.title.trim());

      // Register with password
      const data = await authRegister(fullName.trim(), email.trim(), password);

      // Now update the persona with all the extra data via the speaker update endpoint
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

      // Update speaker profile
      await fetch(`${API_URL}/api/speaker/${data.speaker_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify({
          bio,
          credentials,
          tagline: gritFactor,
          topics: validTopics,
          target_industries: nicheKeyword ? nicheKeyword.split(',').map((s: string) => s.trim()) : [],
          conference_year: conferenceYear,
          conference_tier: conferenceTier,
          location: location.trim(),
          min_honorarium: minHonorarium ? parseInt(minHonorarium.replace(/\D/g, '')) || 0 : 0,
          linkedin: linkedin.trim(),
          website: website.trim(),
          notes: notes.trim(),
        }),
      });

      // Upload files if any
      if (files.length > 0 && data.speaker_id) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await fetch(`${API_URL}/api/speaker/${data.speaker_id}/contents`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY },
            body: formData,
          }).catch(() => {});
        }
      }

      router.push('/?registered=true');
    } catch (err: any) {
      if (err.message.includes('409')) {
        setError('An account with this email already exists. Please login.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#f5f0eb' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold tracking-wider uppercase" style={{ color: 'var(--accent)' }}>
            FREE PERSONA SETUP
          </p>
          <h1 className="text-3xl font-bold mt-1">Build Your Speaker Profile</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            This one-time setup teaches our AI your voice, expertise, and stage presence.
            Takes about 15 minutes. Your first Scout run is included free.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map(({ label, icon: Icon }, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < step ? 'bg-blue-600 border-blue-600 text-white' :
                  i === step ? 'bg-blue-600 border-blue-600 text-white' :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon size={18} />
                </div>
                <span className={`text-[11px] mt-1.5 font-medium ${
                  i <= step ? 'text-blue-700' : 'text-gray-400'
                }`}>{label}</span>
              </div>
              {i < 3 && (
                <div className={`w-16 h-0.5 mx-1 mt-[-18px] ${
                  i < step ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="rounded-lg px-4 py-2.5 mb-6 text-sm border"
          style={{ background: '#fef9c3', borderColor: '#fde047', color: '#854d0e' }}>
          <strong>US / North America only</strong> — international conference matching coming soon.
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          {/* ── Step 1: Core Persona ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Your Core Persona</h2>
                <p className="text-sm text-gray-500 mt-1">
                  This is the foundation. It teaches our AI your voice, expertise, and what makes you uniquely valuable on stage.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Jane Smith" />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jane@example.com" />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Professional Bio & Credentials <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-1.5">
                  Detailed summary of your background, e.g. &quot;30-year ER Physician, Navy Veteran, CNN Medical Contributor.&quot;
                </p>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about your professional background, key roles, and notable achievements..." />
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Key Credentials & Titles</label>
                <input value={credentials} onChange={e => setCredentials(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MD, MBA, FACEP, Board-Certified, etc." />
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Your Grit Factor <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-1.5">
                  What is your unique competitive advantage on stage? The one-line hook that makes you unforgettable.
                </p>
                <textarea value={gritFactor} onChange={e => setGritFactor(e.target.value)} rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='e.g. "ER Grit Meets Executive Strategy" or "Data-Driven Resilience"' />
              </div>
            </div>
          )}

          {/* ── Step 2: Speaking Topics ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Your Speaking Topics</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add a minimum of 1, up to 3 speaking topics. Each one helps the AI match you to the right conferences and craft targeted pitches.
                </p>
              </div>

              {topics.map((topic, i) => (
                <div key={i} className="border rounded-xl p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    TOPIC {i + 1} {i === 0 ? <span className="text-red-500">*</span> : '(optional)'}
                  </p>
                  <div>
                    <label className="text-sm font-bold block mb-1">Talk Title {i === 0 && <span className="text-red-500">*</span>}</label>
                    <input value={topic.title} onChange={e => updateTopic(i, 'title', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={i === 0 ? 'e.g. "Burnout is a Systems Failure"' : `e.g. "${i === 1 ? 'Leading Under Pressure' : 'The Innovation Imperative'}"`} />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1">2-Sentence Abstract</label>
                    <textarea value={topic.abstract} onChange={e => updateTopic(i, 'abstract', e.target.value)}
                      rows={2}
                      className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of this talk and its core message..." />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1">Target Audience</label>
                    <input value={topic.audience} onChange={e => updateTopic(i, 'audience', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Healthcare executives, C-suite leaders, Medical professionals" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 3: Scout Parameters ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Scouting Parameters</h2>
                <p className="text-sm text-gray-500 mt-1">
                  These inputs shape your first Scout run. You can adjust them anytime you launch a new search.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-bold">Niche Keyword</label>
                  <button className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50">
                    <Sparkles size={12} /> Suggest
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-1.5">The specialty to target for this search.</p>
                <textarea value={nicheKeyword} onChange={e => setNicheKeyword(e.target.value)} rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='e.g. "Emergency Medicine," "Physician Wellness," "Health Tech"' />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1">Conference Year <span className="text-red-500">*</span></label>
                  <select value={conferenceYear} onChange={e => setConferenceYear(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Conference Tier</label>
                  <select value={conferenceTier} onChange={e => setConferenceTier(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Geographic Focus <span className="text-red-500">*</span></label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='e.g. "US," "East Coast," "Global"' />
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Minimum Honorarium (optional)</label>
                <p className="text-xs text-gray-400 mb-1.5">Set a floor so we only surface opportunities that meet your fee expectations.</p>
                <input value={minHonorarium} onChange={e => setMinHonorarium(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='e.g. "$5,000" or "Negotiable"' />
              </div>
            </div>
          )}

          {/* ── Step 4: Supporting Materials ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Supporting Materials</h2>
                <p className="text-sm text-gray-500 mt-1">
                  All fields on this page are optional. Upload anything that helps us represent you better.
                </p>
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Upload Supporting Materials</label>
                <p className="text-xs text-gray-400 mb-2">
                  Upload any supporting materials — media kit, speaker sheet, one-pager, or resume. Multiple files accepted.
                </p>
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById('file-input')?.click()}>
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">Click or drag files here</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG · up to 25 MB each · optional</p>
                  <input id="file-input" type="file" className="hidden" multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange} />
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                        <span className="truncate">{f.name}</span>
                        <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-xs text-red-500 hover:underline ml-2 shrink-0">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">LinkedIn Profile</label>
                <input value={linkedin} onChange={e => setLinkedin(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/yourname" />
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Personal Website</label>
                <input value={website} onChange={e => setWebsite(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yoursite.com" />
              </div>

              <div>
                <label className="text-sm font-bold block mb-1">Additional Notes</label>
                <p className="text-xs text-gray-400 mb-1.5">
                  Anything else we should know — past speaking engagements, dream conferences, preferred formats, etc.
                </p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share any additional context that would help us serve you better..." />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300" />
                <span className="text-sm text-gray-600">
                  I have read and agree to the SpeakerAgent.ai{' '}
                  <span className="text-blue-600 underline">Terms of Service</span> and Data Privacy Pledge.
                </span>
              </label>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            {step > 0 ? (
              <button onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <a href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft size={16} /> Login
              </a>
            )}

            {step < 3 ? (
              <button onClick={handleNext}
                className="flex items-center gap-1.5 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90"
                style={{ background: '#1e40af' }}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmitFull} disabled={loading || !agreed}
                className="flex items-center gap-1.5 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
                style={{ background: '#b45309' }}>
                {loading ? 'Setting up...' : 'Submit & Activate My Scout'} {!loading && <ArrowRight size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-start gap-3 bg-white rounded-xl border p-4 max-w-md mx-auto">
          <Shield size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Your data is secure.</p>
            <p className="text-xs text-gray-500">
              Private data pathways and source anonymity. Your proprietary content is never leaked into public AI training models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
