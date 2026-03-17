'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppState } from '@/lib/store';
import { getDashboard, getPipelineStats, getScoutStatus } from '@/lib/api';
import StatsCards from '@/components/StatsCards';
import LeadsTable from '@/components/LeadsTable';
import ContentSidebar from '@/components/ContentSidebar';
import LeadDetailModal from '@/components/LeadDetailModal';
import LeadsProcessing from '@/components/LeadsProcessing';

export default function DashboardPage() {
  const { state, setState } = useAppState();
  const [leads, setLeads] = useState<any[]>([]);
  const [pipelineStats, setPipelineStats] = useState<any>(null);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoutRunning, setScoutRunning] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  // Prevent duplicate in-flight requests
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!state.speakerId || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const params: Record<string, string> = {};
      if (state.activePersonaId) params.persona_id = state.activePersonaId;

      // Fire ALL 3 calls in parallel (was: 2 parallel + 1 sequential)
      const [dashData, pipeData, scoutData] = await Promise.all([
        getDashboard(state.speakerId, params).catch(() => null),
        getPipelineStats(state.speakerId, state.activePersonaId || undefined).catch(() => null),
        getScoutStatus(state.speakerId).catch(() => null),
      ]);

      if (dashData) {
        setLeads(dashData.top_leads || []);
        setDashStats(dashData.stats);

        if (dashData.speaker?.full_name && !state.speakerName) {
          setState({ speakerName: dashData.speaker.full_name });
        }
        if (dashData.persona_id && !state.activePersonaId) {
          setState({ activePersonaId: dashData.persona_id });
        }
      }

      if (pipeData) {
        setPipelineStats(pipeData);
      }

      // Scout status from parallel call
      const apiRunning = scoutData?.scout_status === 'Running';
      setScoutRunning(apiRunning);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
    // REMOVED state.personas from deps — it was causing re-fetch loops
  }, [state.speakerId, state.activePersonaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Only poll when scout is actually running (30s interval)
  useEffect(() => {
    if (!scoutRunning) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [scoutRunning, fetchData]);

  if (!state.speakerId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">No speaker selected.</p>
          <a href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Go to registration</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show Task 1 waiting page whenever there are no leads
  if (leads.length === 0) {
    return (
      <div className="p-6">
        <StatsCards stats={pipelineStats} dashStats={dashStats} />
        <div className="mt-6 flex gap-6">
          <div className="flex-1">
            <LeadsProcessing
              speakerName={state.speakerName}
              onComplete={() => { fetchData(); }}
            />
          </div>
          <ContentSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <StatsCards stats={pipelineStats} dashStats={dashStats} />

      <div className="mt-6 flex gap-6">
        <LeadsTable
          leads={leads}
          scoutRunning={scoutRunning}
          onRefresh={fetchData}
          onLeadClick={setSelectedLead}
        />
        <ContentSidebar />
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => { setSelectedLead(null); fetchData(); }}
        />
      )}
    </div>
  );
}
