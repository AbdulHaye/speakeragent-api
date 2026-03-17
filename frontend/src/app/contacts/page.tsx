'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { getContacts, createContact, updateContact, deleteContact } from '@/lib/api';
import { Plus, Trash2, Edit2, X, Save, Mail, Phone, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

const CONTACT_TYPES = ['Conference Organizer', 'Podcast Host', 'Corporate Events', 'Media', 'Other'];
const STATUSES = ['Not Contacted', 'Reached Out', 'Responded', 'Booked', 'Declined'];

export default function ContactsPage() {
  const { state } = useAppState();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    full_name: '', email: '', phone: '', role_title: '',
    organization: '', contact_type: 'Conference Organizer',
    status: 'Not Contacted', notes: '', linkedin_url: '', website_url: '',
  });

  const fetchContacts = async () => {
    if (!state.speakerId) return;
    try {
      const data = await getContacts(state.speakerId);
      setContacts(data.contacts || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, [state.speakerId]);

  const resetForm = () => {
    setForm({
      full_name: '', email: '', phone: '', role_title: '',
      organization: '', contact_type: 'Conference Organizer',
      status: 'Not Contacted', notes: '', linkedin_url: '', website_url: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateContact(editingId, form);
      } else {
        await createContact(state.speakerId, form);
      }
      resetForm();
      fetchContacts();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contact: any) => {
    // Contacts are flat: {id, full_name, email, ...}
    setForm({
      full_name: contact.full_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      role_title: contact.role_title || '',
      organization: contact.organization || '',
      contact_type: contact.contact_type || 'Conference Organizer',
      status: contact.status || 'Not Contacted',
      notes: contact.notes || '',
      linkedin_url: contact.linkedin_url || '',
      website_url: contact.website_url || '',
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await deleteContact(id);
      fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      'Not Contacted': 'bg-gray-100 text-gray-600',
      'Reached Out': 'bg-blue-100 text-blue-600',
      'Responded': 'bg-yellow-100 text-yellow-600',
      'Booked': 'bg-green-100 text-green-600',
      'Declined': 'bg-red-100 text-red-600',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Contacts</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { setLoading(true); fetchContacts(); }}
            className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit' : 'Add'} Contact</h3>
              <button onClick={resetForm}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="Full name *" />
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="Email" />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="Phone" />
                <input value={form.role_title} onChange={e => setForm({ ...form, role_title: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="Role / Title" />
                <input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="Organization" />
                <select value={form.contact_type} onChange={e => setForm({ ...form, contact_type: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm">
                  {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <input value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="LinkedIn URL" />
              </div>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Notes" />
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contacts table */}
      <div className="bg-white rounded-xl border">
        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.5fr] px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b">
          <span>Name</span>
          <span>Organization</span>
          <span>Type</span>
          <span>Status</span>
          <span>Contact</span>
          <span></span>
        </div>
        {contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No contacts yet</div>
        ) : (
          contacts.map((c: any) => (
              <div key={c.id}
                className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.5fr] px-5 py-3 border-b last:border-b-0 hover:bg-gray-50 items-center text-sm">
                <div>
                  <span className="font-medium">{c.full_name}</span>
                  {c.role_title && <span className="text-gray-400 text-xs ml-1">({c.role_title})</span>}
                </div>
                <span className="text-gray-600">{c.organization || '—'}</span>
                <span className="text-gray-500 text-xs">{c.contact_type || '—'}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block w-fit ${statusColor(c.status)}`}>
                  {c.status}
                </span>
                <div className="flex items-center gap-2">
                  {c.email && <a href={`mailto:${c.email}`} className="text-gray-400 hover:text-blue-600"><Mail size={14} /></a>}
                  {c.phone && <a href={`tel:${c.phone}`} className="text-gray-400 hover:text-blue-600"><Phone size={14} /></a>}
                  {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600"><ExternalLink size={14} /></a>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(c)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
          ))
        )}
      </div>
    </div>
  );
}
