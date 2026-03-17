'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import {
  getPersonas, getPersona, updatePersona, createPersona, deletePersona,
  runPersonaScout, suggestTopics, getSpeaker,
} from '@/lib/api';
import {
  Plus, Trash2, Play, Sparkles, Save, X, Loader2,
  User, FileText, Target, CheckCircle, RefreshCw, Upload,
} from 'lucide-react';

interface Topic {
  title: string;
  abstract: string;
  audience: string;
}

const STEPS = [
  { label: 'Core Persona', icon: User },
  { label: 'Big 3 Topics', icon: FileText },
  { label: 'Scout Parameters', icon: Target },
  { label: 'Supporting Materials', icon: CheckCircle },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
const TIERS = ['Any', 'Local / Regional', 'National', 'International', 'Premium / Keynote'];

export default function PersonaPage() {
  const { state, setState } = useAppState();
  const [personas, setPersonas] = useState<any[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPersona, setLoadingPersona] = useState(false);

  // Speaker info (read-only, not part of persona update)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [credentials, setCredentials] = useState('');
  const [tagline, setTagline] = useState('');
  const [personaName, setPersonaName] = useState('');
  const [topics, setTopics] = useState<Topic[]>([
    { title: '', abstract: '', audience: '' },
    { title: '', abstract: '', audience: '' },
    { title: '', abstract: '', audience: '' },
  ]);
  const [nicheKeyword, setNicheKeyword] = useState('');
  const [conferenceYear, setConferenceYear] = useState(new Date().getFullYear());
  const [conferenceTier, setConferenceTier] = useState('Any');
  const [location, setLocation] = useState('');
  const [minHonorarium, setMinHonorarium] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch speaker info + personas on mount
  useEffect(() => {
    if (!state.speakerId) return;
    const init = async () => {
      setLoading(true);
      try {
        // Fetch speaker info (read-only display)
        const speaker = await getSpeaker(state.speakerId).catch(() => null);
        if (speaker) {
          setFullName(speaker.full_name || state.speakerName || '');
          setEmail(speaker.email || '');
        }
        // Fetch personas
        const data = await getPersonas(state.speakerId);
        const list = data.personas || data || [];
        setPersonas(list);
        setState({ personas: list });
        if (list.length > 0) {
          await loadPersonaIntoForm(list[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [state.speakerId]);

  const fetchPersonas = async () => {
    if (!state.speakerId) return;
    try {
      const data = await getPersonas(state.speakerId);
      const list = data.personas || data || [];
      setPersonas(list);
      setState({ personas: list });
    } catch (err) {
      console.error(err);
    }
  };

  const loadPersonaIntoForm = async (p: any) => {
    setActivePersonaId(p.id);
    setSuggestedTopics([]);
    setStep(0);
    setLoadingPersona(true);
    try {
      const persona = await getPersona(state.speakerId, p.id);
      setPersonaName(persona.persona_name || '');
      setTagline(persona.tagline || '');
      setBio(persona.bio || '');
      setCredentials(persona.credentials || '');
      setLocation(persona.location || '');
      setYearsExperience(String(persona.years_experience || ''));
      setMinHonorarium(String(persona.min_honorarium || ''));
      setLinkedin(persona.linkedin || '');
      setWebsite(persona.website || '');
      setNotes(persona.notes || '');
      setNicheKeyword(
        (() => {
          const ind = typeof persona.target_industries === 'string'
            ? JSON.parse(persona.target_industries)
            : persona.target_industries || [];
          return ind.join(', ');
        })()
      );
      setConferenceYear(persona.conference_year || new Date().getFullYear());
      setConferenceTier(persona.conference_tier || 'Any');

      const parsedTopics = typeof persona.topics === 'string'
        ? JSON.parse(persona.topics)
        : persona.topics || [];
      const filledTopics = [...parsedTopics];
      while (filledTopics.length < 3) {
        filledTopics.push({ title: '', abstract: '', audience: '' });
      }
      setTopics(filledTopics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPersona(false);
    }
  };

  const handleSave = async () => {
    if (!activePersonaId) return;
    setSaving(true);
    try {
      const validTopics = topics.filter(t => t.title.trim());
      const payload: any = {
        persona_name: personaName || undefined,
        tagline,
        bio,
        credentials,
        location,
        years_experience: yearsExperience ? parseInt(yearsExperience) || 0 : 0,
        min_honorarium: minHonorarium ? parseInt(String(minHonorarium).replace(/\D/g, '')) || 0 : 0,
        linkedin,
        website,
        notes,
        topics: validTopics,
        target_industries: nicheKeyword ? nicheKeyword.split(',').map(s => s.trim()).filter(Boolean) : [],
        conference_year: conferenceYear,
        conference_tier: conferenceTier,
      };
      await updatePersona(state.speakerId, activePersonaId, payload);
      await fetchPersonas();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePersona = async () => {
    if (!newPersonaName.trim()) return;
    setCreating(true);
    try {
      const res = await createPersona(state.speakerId, { persona_name: newPersonaName.trim() });
      setShowNewInput(false);
      setNewPersonaName('');
      await fetchPersonas();
      // Load the newly created persona
      if (res?.id) {
        loadPersonaIntoForm({ id: res.id });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePersona = async (id: string) => {
    if (!confirm('Delete this persona?')) return;
    try {
      await deletePersona(state.speakerId, id);
      if (activePersonaId === id) setActivePersonaId(null);
      await fetchPersonas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunScout = async () => {
    if (!activePersonaId) return;
    setRunning(true);
    try {
      await runPersonaScout(state.speakerId, activePersonaId);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const handleSuggestTopics = async () => {
    setLoadingTopics(true);
    try {
      const data = await suggestTopics({
        persona_id: activePersonaId,
        personaBio: bio,
        personaCredentials: credentials,
        topics: topics.filter(t => t.title.trim()),
      });
      setSuggestedTopics(data.topics || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const addSuggestedTopic = (topic: any) => {
    const newTopic = { title: topic.title, abstract: topic.abstract || '', audience: topic.audience || '' };
    // Find first empty slot or append
    const emptyIdx = topics.findIndex(t => !t.title.trim());
    if (emptyIdx >= 0) {
      setTopics(prev => prev.map((t, i) => i === emptyIdx ? newTopic : t));
    } else {
      setTopics(prev => [...prev, newTopic]);
    }
  };

  const updateTopic = (idx: number, field: keyof Topic, value: string) => {
    setTopics(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const removeTopic = (idx: number) => {
    setTopics(prev => prev.filter((_, i) => i !== idx));
  };

  // Build bio preview for persona card
  const getPersonaBioPreview = (p: any) => {
    const b = p.bio || '';
    return b.length > 120 ? b.slice(0, 120) + '...' : b;
  };

  const getPersonaTopicsPreview = (p: any) => {
    try {
      const t = typeof p.topics === 'string' ? JSON.parse(p.topics) : p.topics || [];
      return t.filter((x: any) => x.title).map((x: any) => x.title).join(', ');
    } catch {
      return '';
    }
  };

  // Full-page loader until initial data is ready
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading persona data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Persona</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your speaker profile, topics, and scouting parameters.
        </p>
      </div>

      {/* Additional Personas Section */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-500" />
            <h2 className="text-lg font-bold">Additional Personas</h2>
          </div>
          <button
            onClick={() => setShowNewInput(true)}
            className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            <Plus size={14} /> Add Persona
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Save alternative speaker identities — each with its own bio, grit factor, and topics.
          Load one into the form to make it your active profile.
        </p>

        {/* New persona input */}
        {showNewInput && (
          <div className="flex items-center gap-2 mb-4 p-3 border rounded-lg bg-gray-50">
            <input
              value={newPersonaName}
              onChange={e => setNewPersonaName(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter persona name..."
              onKeyDown={e => e.key === 'Enter' && handleCreatePersona()}
            />
            <button
              onClick={handleCreatePersona}
              disabled={creating || !newPersonaName.trim()}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => { setShowNewInput(false); setNewPersonaName(''); }}
              className="p-1.5 hover:bg-gray-200 rounded">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Persona cards */}
        <div className="space-y-3">
          {personas.map((p: any) => (
            <div
              key={p.id}
              className={`border rounded-lg p-4 flex items-start justify-between transition-colors ${
                activePersonaId === p.id ? 'border-blue-300 bg-blue-50/30' : ''
              }`}
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="font-semibold text-sm">{p.persona_name || 'Core Persona'}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {getPersonaBioPreview(p) || 'No bio set'}
                </p>
                {getPersonaTopicsPreview(p) && (
                  <p className="text-xs text-gray-400 mt-1">
                    Topics: {getPersonaTopicsPreview(p)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => loadPersonaIntoForm(p)}
                  className={`text-xs border rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    activePersonaId === p.id
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Load into form
                </button>
                <button
                  onClick={() => {
                    setActivePersonaId(p.id);
                    handleRunScout();
                  }}
                  className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                  title="Run Scout"
                >
                  <RefreshCw size={16} />
                </button>
                {personas.length > 1 && (
                  <button
                    onClick={() => handleDeletePersona(p.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                    title="Delete persona"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <div key={i} className="flex items-center">
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setStep(i)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                i <= step
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
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

      {/* Form Card */}
      <div className="bg-white rounded-xl border p-6 shadow-sm relative">
        {/* Per-persona loading overlay */}
        {loadingPersona && (
          <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Loading persona...</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Core Persona ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Core Persona</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your foundation details that teach our AI your voice and expertise.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-1">Full Name</label>
                <input
                  value={fullName}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">
                Professional Bio & Credentials <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-1.5">
                Detailed summary of your background, e.g. &quot;30-year ER Physician, Navy Veteran, CNN Medical Contributor.&quot;
              </p>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about your professional background, key roles, and notable achievements..."
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Key Credentials & Titles</label>
              <input
                value={credentials}
                onChange={e => setCredentials(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MD, MBA, FACEP, Board-Certified, etc."
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">
                Your Grit Factor <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-1.5">
                What is your unique competitive advantage on stage? The one-line hook that makes you unforgettable.
              </p>
              <textarea
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='e.g. "ER Grit Meets Executive Strategy" or "Data-Driven Resilience"'
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Persona Name</label>
              <p className="text-xs text-gray-400 mb-1.5">
                A label for this persona (e.g. &quot;Healthcare Expert&quot;, &quot;Tech Leader&quot;).
              </p>
              <input
                value={personaName}
                onChange={e => setPersonaName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Core Persona"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-1">Years of Experience</label>
                <input
                  type="number"
                  value={yearsExperience}
                  onChange={e => setYearsExperience(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Location</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Big 3 Topics ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Your Big 3 Topics</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add your key speaking topics. Each one helps the AI match you to the right conferences and craft targeted pitches.
                </p>
              </div>
              <button
                onClick={handleSuggestTopics}
                disabled={loadingTopics}
                className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 shrink-0"
              >
                {loadingTopics ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Suggest with AI
              </button>
            </div>

            {topics.map((topic, i) => (
              <div key={i} className="border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    TOPIC {i + 1} {i === 0 ? <span className="text-red-500">*</span> : '(optional)'}
                  </p>
                  {i >= 3 && (
                    <button onClick={() => removeTopic(i)}
                      className="text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">
                    Talk Title {i === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={topic.title}
                    onChange={e => updateTopic(i, 'title', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`e.g. "${i === 0 ? 'Burnout is a Systems Failure' : i === 1 ? 'Leading Under Pressure' : 'The Innovation Imperative'}"`}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">2-Sentence Abstract</label>
                  <textarea
                    value={topic.abstract}
                    onChange={e => updateTopic(i, 'abstract', e.target.value)}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of this talk and its core message..."
                  />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Target Audience</label>
                  <input
                    value={topic.audience}
                    onChange={e => updateTopic(i, 'audience', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Healthcare executives, C-suite leaders"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() => setTopics(prev => [...prev, { title: '', abstract: '', audience: '' }])}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add another topic
            </button>

            {/* AI Suggested Topics */}
            {suggestedTopics.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Suggested Topics</h4>
                <div className="space-y-2">
                  {suggestedTopics.map((t: any, i: number) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-3 flex items-start justify-between">
                      <div className="min-w-0 mr-2">
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.abstract}</p>
                        {t.trend && <p className="text-[10px] text-blue-600 mt-1">Trend: {t.trend}</p>}
                      </div>
                      <button
                        onClick={() => addSuggestedTopic(t)}
                        className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Scout Parameters ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Scout Parameters</h2>
              <p className="text-sm text-gray-500 mt-1">
                These inputs shape your Scout runs. Adjust them anytime you launch a new search.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold">Niche Keyword</label>
                <button
                  onClick={handleSuggestTopics}
                  disabled={loadingTopics}
                  className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50"
                >
                  <Sparkles size={12} /> Suggest
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-1.5">The specialty to target for this search.</p>
              <textarea
                value={nicheKeyword}
                onChange={e => setNicheKeyword(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='e.g. "Emergency Medicine," "Physician Wellness," "Health Tech"'
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-1">Conference Year</label>
                <select
                  value={conferenceYear}
                  onChange={e => setConferenceYear(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Conference Tier</label>
                <select
                  value={conferenceTier}
                  onChange={e => setConferenceTier(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Geographic Focus</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='e.g. "US," "East Coast," "Global"'
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Minimum Honorarium</label>
              <p className="text-xs text-gray-400 mb-1.5">Set a floor so we only surface opportunities that meet your fee expectations.</p>
              <input
                value={minHonorarium}
                onChange={e => setMinHonorarium(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='e.g. "$5,000" or "Negotiable"'
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Supporting Materials ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Supporting Materials</h2>
              <p className="text-sm text-gray-500 mt-1">
                Links and notes that help us represent you better. All fields are optional.
              </p>
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">LinkedIn Profile</label>
              <input
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Personal Website</label>
              <input
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yoursite.com"
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Additional Notes</label>
              <p className="text-xs text-gray-400 mb-1.5">
                Anything else — past speaking engagements, dream conferences, preferred formats, etc.
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share any additional context that would help us serve you better..."
              />
            </div>
          </div>
        )}

        {/* Navigation & Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                &larr; Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Save button - always visible */}
            <button
              onClick={handleSave}
              disabled={saving || !activePersonaId}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>

            {/* Run Scout */}
            <button
              onClick={handleRunScout}
              disabled={running || !activePersonaId}
              className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Run Scout
            </button>

            {/* Next step */}
            {step < 3 && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="text-sm text-white font-medium px-4 py-2 rounded-lg hover:opacity-90"
                style={{ background: '#1e40af' }}
              >
                Continue &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
