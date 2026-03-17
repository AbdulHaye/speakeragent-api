'use client';

import { useState } from 'react';
import { X, ExternalLink, Mail, MapPin, Calendar, Send } from 'lucide-react';
import { updateLeadStatus, updateLeadMessage } from '@/lib/api';

interface LeadDetailModalProps {
  lead: any; // flat: {id, "Conference Name", "Match Score", ...}
  onClose: () => void;
  onUpdated: () => void;
}

const STATUSES = ['New', 'Contacted', 'Replied', 'Booked', 'Passed', 'Rejected'];

export default function LeadDetailModal({ lead, onClose, onUpdated }: LeadDetailModalProps) {
  const [status, setStatus] = useState(lead['Lead Status'] || 'New');
  const [message, setMessage] = useState(lead['Approval Message'] || lead['Hook'] || '');
  const [saving, setSaving] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setSaving(true);
    try {
      await updateLeadStatus(lead.id, { status: newStatus });
      setStatus(newStatus);
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    setSaving(true);
    try {
      await updateLeadMessage(lead.id, {
        message,
        contact_name: lead['Contact Name'],
        contact_email: lead['Contact Email'],
      });
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const triageColor = lead['Lead Triage'] === 'GREEN' ? 'text-green-600 bg-green-50' :
    lead['Lead Triage'] === 'YELLOW' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{lead['Conference Name'] || 'Untitled'}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${triageColor}`}>
                {lead['Lead Triage'] || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {lead['Location'] && <span className="flex items-center gap-1"><MapPin size={12} />{lead['Location']}</span>}
              {lead['Event Date'] && <span className="flex items-center gap-1"><Calendar size={12} />{lead['Event Date']}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Score & Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Match Score</div>
              <div className="text-2xl font-bold">{lead['Match Score'] || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Best Topic</div>
              <div className="text-sm font-medium">{lead['Best Topic'] || '—'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Event Type</div>
              <div className="text-sm font-medium">{lead['Event Type'] || 'Conference'}</div>
            </div>
          </div>

          {/* Hook */}
          {lead['Hook'] && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">AI-Generated Pitch</h4>
              <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 italic">{lead['Hook']}</p>
            </div>
          )}

          {/* Contact */}
          {(lead['Contact Name'] || lead['Contact Email']) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact</h4>
              <div className="flex items-center gap-3 text-sm">
                {lead['Contact Name'] && <span className="font-medium">{lead['Contact Name']}</span>}
                {lead['Contact Email'] && (
                  <a href={`mailto:${lead['Contact Email']}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Mail size={12} />{lead['Contact Email']}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status update */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</h4>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s}
                  onClick={() => handleStatusUpdate(s)}
                  disabled={saving}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    status === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Message editor */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Outreach Message</h4>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Edit the pitch message..." />
            <button onClick={handleSendMessage} disabled={saving}
              className="mt-2 flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Send size={14} /> Approve & Send
            </button>
          </div>

          {/* URL */}
          {lead['URL'] && (
            <a href={lead['URL']} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              <ExternalLink size={14} /> View Event Page
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
