const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response: Response) {
  if (response.status === 401) {
    // Token tidak valid atau kedaluwarsa. Hapus data sesi dan redirect ke login.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Tambahkan parameter untuk menampilkan pesan di halaman login (opsional)
    window.location.href = '/member?session_expired=true';
    // Throw error untuk menghentikan eksekusi kode selanjutnya
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.errors?.[0]?.message || 'Something went wrong');
  }
  return data;
}

export const api = {
  async get(endpoint: string, signal?: AbortSignal) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal,
    });
    return handleResponse(response);
  },

  async post(endpoint: string, body?: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async patch(endpoint: string, body?: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async upload(endpoint: string, formData: FormData) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  events: {
    list: (signal?: AbortSignal) => api.get('/api/events', signal),
    get: (id: string, signal?: AbortSignal) => api.get(`/api/events/${id}`, signal),
    create: (data: any) => api.post('/api/events', data),
    update: (id: string, data: any) => api.patch(`/api/events/${id}`, data),
    finish: (id: string, data: any) => api.post(`/api/events/${id}/finish`, data),
    updateAttendance: (id: string, data: any) => api.patch(`/api/events/${id}/attendance`, data),
    rsvp: (id: string, data: { rsvp: 'hadir' | 'tidak_hadir' }) => api.post(`/api/events/${id}/rsvp`, data),
    invite: (id: string, data: { userIds?: string[]; externals?: any[] }) => api.post(`/api/events/${id}/invite`, data),
    getTeam: (id: string, scope: 'all' | 'downline' = 'all', signal?: AbortSignal) => api.get(`/api/events/${id}/team?scope=${scope}`, signal),
  },
};
