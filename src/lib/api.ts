/* Centralized API client using fetch and JWT token from localStorage.
   IMPORTANT: Frontend API calls MUST ONLY use REACT_APP_BACKEND_URL from env.
   Ensure your environment sets REACT_APP_BACKEND_URL and that it already includes '/api' prefix. */

export type LoginResponse = { access_token: string; token_type: string };

const getBackendUrl = (): string => {
  // Per platform rules, the frontend must use REACT_APP_BACKEND_URL
  // We try both import.meta.env and process.env for compatibility
  const url = (import.meta as any)?.env?.REACT_APP_BACKEND_URL || (process as any)?.env?.REACT_APP_BACKEND_URL;
  if (!url) {
    throw new Error('REACT_APP_BACKEND_URL is not set. Please set it in the frontend environment.');
  }
  return String(url).replace(/\/$/, '');
};

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const withAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const token = getToken();
  if (token) {
    return { ...headers, Authorization: `Bearer ${token}` };
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || res.statusText;
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }
  return data;
};

export const api = {
  // AUTH
  async register(body: {
    name: string; email: string; password: string; role: 'student'|'admin'; department?: string; studentId?: string;
  }): Promise<LoginResponse> {
    const res = await fetch(`${getBackendUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const params = new URLSearchParams();
    params.set('username', email);
    params.set('password', password);
    const res = await fetch(`${getBackendUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    return handleResponse(res);
  },

  async me() {
    const res = await fetch(`${getBackendUrl()}/auth/me`, {
      headers: withAuthHeaders(),
    });
    return handleResponse(res);
  },

  // COMPLAINTS
  async getComplaints(status_filter?: string) {
    const url = new URL(`${getBackendUrl()}/complaints`, window.location.origin);
    // We cannot construct absolute URL reliably with URL without origin in some environments; use string concat
    const full = `${getBackendUrl()}/complaints${status_filter ? `?status_filter=${encodeURIComponent(status_filter)}` : ''}`;
    const res = await fetch(full, { headers: withAuthHeaders() });
    return handleResponse(res);
  },

  async createComplaint(body: {
    title: string; description: string; category: string; department: string; isAnonymous: boolean;
  }) {
    const res = await fetch(`${getBackendUrl()}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...withAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async updateComplaintStatus(complaintId: string, newStatus: string) {
    const res = await fetch(`${getBackendUrl()}/complaints/${encodeURIComponent(complaintId)}/status?new_status=${encodeURIComponent(newStatus)}`, {
      method: 'PATCH',
      headers: withAuthHeaders(),
    });
    return handleResponse(res);
  },

  async addResponse(complaintId: string, content: string) {
    const res = await fetch(`${getBackendUrl()}/complaints/${encodeURIComponent(complaintId)}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...withAuthHeaders() },
      body: JSON.stringify({ content }),
    });
    return handleResponse(res);
  },

  async addFeedback(complaintId: string, rating: number, comment: string) {
    const res = await fetch(`${getBackendUrl()}/complaints/${encodeURIComponent(complaintId)}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...withAuthHeaders() },
      body: JSON.stringify({ rating, comment }),
    });
    return handleResponse(res);
  },
};