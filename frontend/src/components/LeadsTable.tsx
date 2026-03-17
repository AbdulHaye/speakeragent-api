'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, ExternalLink } from 'lucide-react';

const STATUS_TABS = ['RESEARCHING', 'PITCHED', 'FOLLOW-UP SENT', 'INTERESTED', 'BOOKED', 'REJECTED'];
const TYPE_TABS = ['All', 'Conference', 'Podcast', 'Corporate Events', 'Local Events', 'Other'];

const STATUS_MAP: Record<string, string> = {
  'RESEARCHING': 'New',
  'PITCHED': 'Contacted',
  'FOLLOW-UP SENT': 'Replied',
  'INTERESTED': 'Replied',
  'BOOKED': 'Booked',
  'REJECTED': 'Passed',
};

interface LeadsTableProps {
  leads: any[];
  scoutRunning: boolean;
  onRefresh: () => void;
  onLeadClick: (lead: any) => void;
}

function TriageBadge({ triage }: { triage: string }) {
  const colors: Record<string, string> = {
    GREEN: 'bg-green-100 text-green-700',
    YELLOW: 'bg-yellow-100 text-yellow-700',
    RED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors[triage] || 'bg-gray-100 text-gray-500'}`}>
      {triage}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 65 ? '#22c55e' : score >= 35 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-medium">{score}</span>
    </div>
  );
}

export default function LeadsTable({ leads, scoutRunning, onRefresh, onLeadClick }: LeadsTableProps) {
  const [activeStatus, setActiveStatus] = useState('RESEARCHING');
  const [activeType, setActiveType] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Leads are flat: {id, "Conference Name", "Lead Status", "Lead Triage", "Match Score", ...}
  const filtered = leads.filter(l => {
    const statusMatch = STATUS_MAP[activeStatus]
      ? (l['Lead Status'] || 'New') === STATUS_MAP[activeStatus]
      : true;
    const typeMatch = activeType === 'All' || (l['Event Type'] || 'Conference') === activeType;
    return statusMatch && typeMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="bg-white rounded-xl border flex-1">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-gray-400">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          </div>
          <h2 className="text-lg font-bold">Live Manifest</h2>
          {scoutRunning && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Scout Running
            </span>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button key={tab}
              onClick={() => { setActiveStatus(tab); setPage(1); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeStatus === tab
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 flex-wrap">
          {TYPE_TABS.map(tab => (
            <button key={tab}
              onClick={() => { setActiveType(tab); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeType === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr_0.8fr_0.6fr] px-5 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-t">
        <span>Event</span>
        <span>Target Persona</span>
        <span>Status</span>
        <span>Core IP Angle</span>
        <span>Match ↓</span>
        <span>Fee</span>
      </div>

      {/* Body */}
      <div className="min-h-[300px]">
        {scoutRunning && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <RefreshCw size={32} className="text-blue-400 animate-spin-slow" />
            </div>
            <h3 className="text-lg font-bold mb-1">Scout is running...</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-4">
              Your AI scout is actively searching for conferences that match your expertise. Results will appear here shortly.
            </p>
            <div className="flex gap-1 mb-4">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-blue-500 pulse-dot" />
              ))}
            </div>
            <button onClick={onRefresh}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <RefreshCw size={14} /> Check for new leads
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">No opportunities</p>
          </div>
        ) : (
          paginated.map((lead: any) => (
            <div key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr_0.8fr_0.6fr] px-5 py-3 border-t hover:bg-gray-50 cursor-pointer items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{lead['Conference Name'] || 'Untitled'}</span>
                {lead['URL'] && (
                  <a href={lead['URL']} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}>
                    <ExternalLink size={12} className="text-gray-400" />
                  </a>
                )}
              </div>
              <span className="text-gray-500 truncate">{lead['persona_name'] || 'Core Persona'}</span>
              <div>
                <TriageBadge triage={lead['Lead Triage'] || 'RED'} />
              </div>
              <span className="text-gray-600 truncate">{lead['Best Topic'] || '—'}</span>
              <ScoreBar score={lead['Match Score'] || 0} />
              <span className="text-gray-500 text-xs">{lead['Pay Estimate'] || '—'}</span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-400">
        <span>{filtered.length === 0 ? 'No opportunities' : `${filtered.length} opportunities`}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
