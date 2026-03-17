'use client';

import { useState, useEffect } from 'react';
import { getAdminSpeakers, getLeadStats, healthCheck } from '@/lib/api';
import {
  Users, Activity, Database, Server, Send, BookCheck,
  CheckCircle2, XCircle, RefreshCw, Search,
  ChevronDown, ChevronUp, BarChart3, Target, TrendingUp, Clock
} from 'lucide-react';

interface SystemHealth {
  api: 'healthy' | 'unhealthy' | 'checking';
  latency: number;
  lastChecked: string;
  cronActive: boolean;
}

export default function AdminPage() {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [health, setHealth] = useState<SystemHealth>({ api: 'checking', latency: 0, lastChecked: '', cronActive: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedSpeaker, setExpandedSpeaker] = useState<string | null>(null);
  const [speakerStats, setSpeakerStats] = useState<Record<string, any>>({});
  const [globalAgg, setGlobalAgg] = useState({ totalLeads: 0, green: 0, yellow: 0, red: 0, booked: 0, contacted: 0, replied: 0, newLeads: 0, passed: 0, avgScore: 0, loadedCount: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Health check with latency
      const healthStart = performance.now();
      try {
        const hData = await healthCheck();
        setHealth({
          api: 'healthy',
          latency: Math.round(performance.now() - healthStart),
          lastChecked: new Date().toLocaleTimeString(),
          cronActive: hData?.cron_active || false,
        });
      } catch {
        setHealth({
          api: 'unhealthy',
          latency: Math.round(performance.now() - healthStart),
          lastChecked: new Date().toLocaleTimeString(),
          cronActive: false,
        });
      }

      // Speakers
      const speakersData = await getAdminSpeakers().catch(() => ({ speakers: [] }));
      const speakersList = speakersData?.speakers || [];
      setSpeakers(Array.isArray(speakersList) ? speakersList : []);

      // Aggregate global stats from all speakers
      if (speakersList.length > 0) {
        setStatsLoading(true);
        const agg = { totalLeads: 0, green: 0, yellow: 0, red: 0, booked: 0, contacted: 0, replied: 0, newLeads: 0, passed: 0, avgScore: 0, loadedCount: 0 };
        const results = await Promise.allSettled(
          speakersList.map((s: any) => getLeadStats(s.speaker_id))
        );
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value) {
            const st = r.value;
            agg.totalLeads += st.total || 0;
            agg.green += st.by_triage?.GREEN || 0;
            agg.yellow += st.by_triage?.YELLOW || 0;
            agg.red += st.by_triage?.RED || 0;
            agg.booked += st.by_status?.Booked || 0;
            agg.contacted += st.by_status?.Contacted || 0;
            agg.replied += st.by_status?.Replied || 0;
            agg.newLeads += st.by_status?.New || 0;
            agg.passed += st.by_status?.Passed || 0;
            agg.avgScore += st.avg_score || 0;
            agg.loadedCount += 1;
            // Cache per-speaker
            setSpeakerStats(prev => ({ ...prev, [speakersList[i].speaker_id]: st }));
          }
        });
        if (agg.loadedCount > 0) agg.avgScore = Math.round((agg.avgScore / agg.loadedCount) * 10) / 10;
        setGlobalAgg(agg);
        setStatsLoading(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchSpeakerStats = async (speakerId: string) => {
    if (speakerStats[speakerId]) return;
    try {
      const stats = await getLeadStats(speakerId);
      setSpeakerStats(prev => ({ ...prev, [speakerId]: stats }));
    } catch {
      setSpeakerStats(prev => ({ ...prev, [speakerId]: null }));
    }
  };

  const toggleSpeaker = (speakerId: string) => {
    if (expandedSpeaker === speakerId) {
      setExpandedSpeaker(null);
    } else {
      setExpandedSpeaker(speakerId);
      fetchSpeakerStats(speakerId);
    }
  };

  const filtered = speakers.filter(s => {
    const q = search.toLowerCase();
    return !q || (s.full_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.speaker_id || '').toLowerCase().includes(q);
  });

  const deliveredLeads = globalAgg.contacted + globalAgg.replied + globalAgg.booked;
  const conversionRate = globalAgg.totalLeads > 0 ? Math.round((globalAgg.booked / globalAgg.totalLeads) * 100) : 0;
  const triageTotal = globalAgg.green + globalAgg.yellow + globalAgg.red || 1;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">System overview, user management & lead analytics</p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── System Health Overview ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide">API STATUS</span>
            <Server size={18} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            {health.api === 'healthy' ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : health.api === 'unhealthy' ? (
              <XCircle size={20} className="text-red-500" />
            ) : (
              <RefreshCw size={20} className="text-gray-400 animate-spin" />
            )}
            <span className={`text-lg font-bold ${
              health.api === 'healthy' ? 'text-green-600' :
              health.api === 'unhealthy' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {health.api === 'healthy' ? 'Healthy' : health.api === 'unhealthy' ? 'Down' : 'Checking...'}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {health.latency}ms {health.lastChecked && `· ${health.lastChecked}`}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide">CRON SCHEDULER</span>
            <Clock size={18} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            {health.cronActive ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-yellow-500" />
            )}
            <span className={`text-lg font-bold ${health.cronActive ? 'text-green-600' : 'text-yellow-600'}`}>
              {health.cronActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Daily scout at 6 AM EST</div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide">DATABASE</span>
            <Database size={18} className="text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500" />
            <span className="text-lg font-bold text-green-600">Connected</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Airtable · {speakers.length} speakers</div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide">TOTAL USERS</span>
            <Users size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold">{speakers.length}</div>
          <div className="text-xs text-gray-400 mt-1">Registered speakers</div>
        </div>
      </div>

      {/* ── Lead Generation Stats ── */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={16} /> Lead Generation Stats {statsLoading && <RefreshCw size={12} className="animate-spin text-gray-400" />}
        </h3>

        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Target size={16} className="mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{globalAgg.totalLeads}</div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Leads Found</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Send size={16} className="mx-auto mb-1 text-indigo-500" />
            <div className="text-2xl font-bold">{deliveredLeads}</div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Delivered</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Activity size={16} className="mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold">{globalAgg.contacted}</div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Contacted</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <TrendingUp size={16} className="mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{globalAgg.replied}</div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Replied</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <BookCheck size={16} className="mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{globalAgg.booked}</div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Booked</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <BarChart3 size={16} className="mx-auto mb-1 text-gray-500" />
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Conversion</div>
          </div>
        </div>

        {/* Triage breakdown bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Lead Triage Breakdown</span>
            <span>Avg Score: {globalAgg.avgScore || '—'}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {globalAgg.green > 0 && <div className="h-full bg-green-500 transition-all" style={{ width: `${(globalAgg.green / triageTotal) * 100}%` }} />}
            {globalAgg.yellow > 0 && <div className="h-full bg-yellow-400 transition-all" style={{ width: `${(globalAgg.yellow / triageTotal) * 100}%` }} />}
            {globalAgg.red > 0 && <div className="h-full bg-red-400 transition-all" style={{ width: `${(globalAgg.red / triageTotal) * 100}%` }} />}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{globalAgg.green} GREEN</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />{globalAgg.yellow} YELLOW</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />{globalAgg.red} RED</span>
            <span className="ml-auto">{globalAgg.newLeads} new · {globalAgg.passed} passed</span>
          </div>
        </div>
      </div>

      {/* ── All Users & Request History ── */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">All Users & Request History ({filtered.length})</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-64"
              placeholder="Search users..." />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1.8fr_2fr_0.7fr_0.7fr_0.8fr_0.8fr_0.4fr] px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b">
          <span>Speaker</span>
          <span>Email</span>
          <span>Plan</span>
          <span>Joined</span>
          <span>Leads Found</span>
          <span>Delivered</span>
          <span></span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No users found</div>
        ) : (
          filtered.map((s: any) => {
            const isExpanded = expandedSpeaker === s.speaker_id;
            const stats = speakerStats[s.speaker_id];
            const planColor = s.plan === 'Pro' ? 'bg-purple-100 text-purple-600' :
              s.plan === 'Starter' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600';
            const sTotal = stats?.total || 0;
            const sDelivered = (stats?.by_status?.Contacted || 0) + (stats?.by_status?.Replied || 0) + (stats?.by_status?.Booked || 0);

            return (
              <div key={s.id}>
                <div className="grid grid-cols-[1.8fr_2fr_0.7fr_0.7fr_0.8fr_0.8fr_0.4fr] px-5 py-3 border-b hover:bg-gray-50 items-center text-sm cursor-pointer"
                  onClick={() => toggleSpeaker(s.speaker_id)}>
                  <div>
                    <span className="font-medium">{s.full_name || '—'}</span>
                  </div>
                  <span className="text-gray-600 truncate">{s.email || '—'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block w-fit ${planColor}`}>
                    {s.plan || 'Free'}
                  </span>
                  <span className="text-gray-500 text-xs">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</span>
                  <span className="font-medium">{stats ? sTotal : '—'}</span>
                  <span className="font-medium">{stats ? sDelivered : '—'}</span>
                  <div className="flex justify-end">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 py-4 bg-gray-50 border-b">
                    {stats ? (
                      <>
                        <div className="grid grid-cols-7 gap-3 mb-3">
                          <div className="bg-white rounded-lg p-2.5 text-center border">
                            <div className="text-lg font-bold">{stats.total || 0}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-semibold">Total</div>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 text-center border">
                            <div className="text-lg font-bold text-green-600">{stats.by_triage?.GREEN || 0}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-semibold">Green</div>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 text-center border">
                            <div className="text-lg font-bold text-yellow-600">{stats.by_triage?.YELLOW || 0}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-semibold">Yellow</div>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 text-center border">
                            <div className="text-lg font-bold text-red-600">{stats.by_triage?.RED || 0}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-semibold">Red</div>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 text-center border">
                            <div className="text-lg font-bold text-blue-600">{stats.by_status?.Contacted || 0}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-semibold">Contacted</div>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 text-center border">
                            <div className="text-lg font-bold text-green-600">{stats.by_status?.Booked || 0}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-semibold">Booked</div>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 text-center border">
                            <div className="text-lg font-bold">{stats.avg_score?.toFixed(1) || '—'}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-semibold">Avg Score</div>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><strong>Status:</strong> {s.status || 'active'}</span>
                          <span><strong>New:</strong> {stats.by_status?.New || 0}</span>
                          <span><strong>Replied:</strong> {stats.by_status?.Replied || 0}</span>
                          <span><strong>Passed:</strong> {stats.by_status?.Passed || 0}</span>
                        </div>
                      </>
                    ) : stats === null ? (
                      <div className="text-sm text-gray-400">No lead data available</div>
                    ) : (
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" /> Loading stats...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
