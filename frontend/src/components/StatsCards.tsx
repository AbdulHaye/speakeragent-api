'use client';

import { Target, Send, TrendingUp, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  stats: any; // pipeline-stats response
  dashStats?: any; // from /api/dashboard stats (lead_stats)
}

export default function StatsCards({ stats, dashStats }: StatsCardsProps) {
  // Use pipeline-stats response format:
  // { opportunities_identified: {value, change_label}, active_pitches: {...}, response_rate: {...}, revenue_pipeline: {...} }
  const opp = stats?.opportunities_identified;
  const pitch = stats?.active_pitches;
  const rate = stats?.response_rate;
  const rev = stats?.revenue_pipeline;

  const cards = [
    {
      label: 'OPPORTUNITIES IDENTIFIED',
      value: opp?.value ?? dashStats?.total ?? 0,
      sub: opp?.change_label ?? `${dashStats?.total ?? 0} total`,
      icon: Target,
      iconColor: '#22c55e',
    },
    {
      label: 'ACTIVE PITCHES',
      value: pitch?.value ?? 0,
      sub: pitch?.change_label ?? '0 awaiting response',
      icon: Send,
      iconColor: '#3b82f6',
    },
    {
      label: 'RESPONSE RATE',
      value: rate?.value_formatted ?? `${rate?.value ?? 0}%`,
      sub: rate?.change_label ?? 'Same as last month',
      icon: TrendingUp,
      iconColor: '#f59e0b',
    },
    {
      label: 'REVENUE PIPELINE',
      value: rev?.value_formatted ?? `$${rev?.value ?? 0}`,
      sub: rev?.change_label ?? '0 active leads',
      icon: DollarSign,
      iconColor: '#22c55e',
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, iconColor, highlight }) => (
        <div key={label}
          className={`rounded-xl border p-5 ${highlight ? 'bg-amber-50/50 border-amber-200' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</span>
            <Icon size={18} style={{ color: iconColor }} />
          </div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-xs text-gray-400 mt-1">{sub}</div>
        </div>
      ))}
    </div>
  );
}
