const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Speaker ──
export const getSpeaker = (id: string) => request<any>(`/api/speaker/${id}`);
export const updateSpeaker = (id: string, data: any) =>
  request<any>(`/api/speaker/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const registerSpeaker = (data: any) =>
  request<any>('/api/speakers/register', { method: 'POST', body: JSON.stringify(data) });
export const getSpeakerByEmail = (email: string) =>
  request<any>(`/api/speakers/by-email/${encodeURIComponent(email)}`);

// ── Auth ──
export const authRegister = (full_name: string, email: string, password: string) =>
  request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify({ full_name, email, password }) });
export const authLogin = (email: string, password: string) =>
  request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// ── Persona ──
export const getPersonas = (speakerId: string) =>
  request<any>(`/api/speaker/${speakerId}/personas`);
export const getPersona = (speakerId: string, personaId: string) =>
  request<any>(`/api/speaker/${speakerId}/persona/${personaId}`);
export const createPersona = (speakerId: string, data: any) =>
  request<any>(`/api/speaker/${speakerId}/persona`, { method: 'POST', body: JSON.stringify(data) });
export const updatePersona = (speakerId: string, personaId: string, data: any) =>
  request<any>(`/api/speaker/${speakerId}/persona/${personaId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePersona = (speakerId: string, personaId: string) =>
  request<any>(`/api/speaker/${speakerId}/persona/${personaId}`, { method: 'DELETE' });

// ── Dashboard (combined endpoint) ──
export const getDashboard = (speakerId: string, params: Record<string, string> = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request<any>(`/api/dashboard/${speakerId}${qs ? `?${qs}` : ''}`);
};
export const getPipelineStats = (speakerId: string, personaId?: string) => {
  const qs = personaId ? `?persona_id=${personaId}` : '';
  return request<any>(`/api/dashboard/${speakerId}/pipeline-stats${qs}`);
};

// ── Leads ──
export const getLeads = (speakerId: string, params: Record<string, string> = {}) => {
  const allParams = { speaker_id: speakerId, ...params };
  const qs = new URLSearchParams(allParams).toString();
  return request<any>(`/api/leads?${qs}`);
};
export const getLead = (id: string) => request<any>(`/api/leads/${id}`);
export const getLeadStats = (speakerId: string, personaId?: string) => {
  const params: Record<string, string> = { speaker_id: speakerId };
  if (personaId) params.persona_id = personaId;
  const qs = new URLSearchParams(params).toString();
  return request<any>(`/api/leads/stats?${qs}`);
};
export const updateLeadStatus = (id: string, data: any) =>
  request<any>(`/api/leads/${id}/status`, { method: 'PUT', body: JSON.stringify(data) });
export const updateLeadMessage = (id: string, data: any) =>
  request<any>(`/api/leads/${id}/message`, { method: 'PUT', body: JSON.stringify(data) });

// ── Scout ──
export const runScout = (data: any) =>
  request<any>('/api/scout/run', { method: 'POST', body: JSON.stringify(data) });
export const getScoutStatus = (speakerId: string) =>
  request<any>(`/api/scout/status/${speakerId}`);
export const runPersonaScout = (speakerId: string, personaId: string) =>
  request<any>(`/api/speaker/${speakerId}/persona/${personaId}/scout`, { method: 'POST' });
export const getPersonaLeads = (speakerId: string, personaId: string) =>
  request<any>(`/api/speaker/${speakerId}/persona/${personaId}/leads`);

// ── Contacts ──
export const getContacts = (speakerId: string) =>
  request<any>(`/api/speaker/${speakerId}/contacts`);
export const createContact = (speakerId: string, data: any) =>
  request<any>(`/api/speaker/${speakerId}/contacts`, { method: 'POST', body: JSON.stringify(data) });
export const updateContact = (id: string, data: any) =>
  request<any>(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteContact = (id: string) =>
  request<any>(`/api/contacts/${id}`, { method: 'DELETE' });

// ── Checklist ──
export const getChecklist = (speakerId: string) =>
  request<any>(`/api/speaker/${speakerId}/checklist`);
export const completeChecklistTask = (speakerId: string, task: string) =>
  request<any>(`/api/speaker/${speakerId}/checklist/complete`, {
    method: 'PATCH', body: JSON.stringify({ task }),
  });

// ── Topics ──
export const suggestTopics = (data: any) =>
  request<any>('/api/topics', { method: 'POST', body: JSON.stringify(data) });

// ── Email ──
export const sendEmail = (data: any) =>
  request<any>('/api/send-email', { method: 'POST', body: JSON.stringify(data) });

// ── Admin ──
export const getAdminSpeakers = () => request<any>('/api/admin/speakers');

// ── Health ──
export const healthCheck = () => request<any>('/health');

// ── Upload ──
export const uploadContents = (speakerId: string, formData: FormData) =>
  fetch(`${API_URL}/api/speaker/${speakerId}/contents`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: formData,
  }).then(r => r.json());
