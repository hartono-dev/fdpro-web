export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
    // Bypass global interceptor untuk endpoint login.
    // Jika error 401 berasal dari login, biarkan ditangani oleh komponen LoginPage.
    if (response.url.includes('/api/auth/login')) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Unauthorized');
    }

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
        const apiError = new Error(data.message || data.errors?.[0]?.message || 'Something went wrong') as Error & { status?: number; code?: string; meta?: any; errors?: any };
    // Lampirkan status HTTP (mis. 429 rate limit) agar komponen panggil dapat
    // membedakan jenis kegagalan tanpa hanya mengandalkan teks pesan.
    apiError.status = response.status;
    // Debug payload (dev): teruskan constraint-code & meta dari backend
    // agar UI dapat menampilkan *kenapa* request gagal di dev console/toast.
    if (data.code) apiError.code = data.code;
    if (data.meta) apiError.meta = data.meta;
    if (data.errors) apiError.errors = data.errors;
    throw apiError;
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

  // ---- Public / anon lead submission (Incognito / landing page) ----
  // Endpoint POST /api/leads tidak memerlukan token; header auth tetap dikirim
  // kosong bila tidak ada sesi (handleResponse tidak redirect pada 401 kecuali login).
  async create(endpoint: string, body: unknown) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
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

  // PRD §5.5 (changelog #86): DELETE method untuk menghapus peserta daftar hadir.
  async del(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

      async upload(endpoint: string, formData: FormData) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`[api.upload] Sending POST to ${API_URL}${endpoint}`, {
      hasToken: !!token,
            formDataEntries: Array.from(formData.entries()).map(([k, v]) => {
        if (typeof v === 'string') {
          return { key: k, name: v, size: 0, type: undefined };
        }
        // v is File (which extends Blob) after string check
        return { key: k, name: v.name, size: v.size, type: v.type };
      }),
    });
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      console.log(`[api.upload] Response status: ${response.status}`);
      return handleResponse(response);
    } catch (err) {
      console.error(`[api.upload] Network error to ${API_URL}${endpoint}:`, err);
      throw err;
    }
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
                team: (
          id: string,
          opts: { scope?: 'all' | 'downline'; search?: string; limit?: number } = {},
          signal?: AbortSignal
        ) => {
          const params = new URLSearchParams();
          params.set('scope', opts.scope ?? 'all');
          if (opts.search) params.set('search', opts.search);
          if (opts.limit) params.set('limit', String(opts.limit));
          return api.get(`/api/events/${id}/team?${params.toString()}`, signal);
        },
    // PRD §5.5 (changelog #86) — manajemen daftar hadir di tab Riwayat (creator).
        participants: {
      list: (id: string, signal?: AbortSignal) => api.get(`/api/events/${id}/participants`, signal),
      remove: (id: string, participantId: string) => api.del(`/api/events/${id}/participants/${participantId}`),
      add: (id: string, data: { userIds: string[] }) => api.post(`/api/events/${id}/participants`, data),
    },
    attendance: {
      submit: (id: string) => api.post(`/api/events/${id}/attendance/submit`, {}),
    },
  },
    // API.md: address cascade endpoints
  address: {
    provinces: () => api.get('/api/address/provinces'),
    cities: (provinceId: string) => api.get(`/api/address/cities/${provinceId}`),
    districts: (cityId: string) => api.get(`/api/address/districts/${cityId}`),
    villages: (districtId: string) => api.get(`/api/address/villages/${districtId}`),
    updateProvince: (provinceId: string, data: { name: string }) =>
      api.patch(`/api/address/provinces/${provinceId}`, data),
    updateCity: (cityId: string, data: { name: string }) =>
      api.patch(`/api/address/cities/${cityId}`, data),
    updateDistrict: (districtId: string, data: { name: string }) =>
      api.patch(`/api/address/districts/${districtId}`, data),
    updateVillage: (villageId: string, data: { name?: string; postalCode?: string }) =>
      api.patch(`/api/address/villages/${villageId}`, data),
  },
  leads: {
    create: (data: any) => api.create('/api/leads', data),
    pool: () => api.get('/api/leads/pool'),
    myLeads: () => api.get('/api/leads/my-leads'),
    pickup: (leadId: string, body?: any) => api.post(`/api/leads/${leadId}/pickup`, body),
    reject: (leadId: string, body?: any) => api.post(`/api/leads/${leadId}/reject`, body),
    cancel: (leadId: string, body?: any) => api.post(`/api/leads/${leadId}/cancel`, body),
    recruit: (leadId: string, body?: any) => api.post(`/api/leads/${leadId}/recruit`, body),
  },
};

/**
 * Konversi URL avatar relatif ke absolute URL.
 *
 * Backend menyimpan avatarUrl relatif (mis. `/uploads/avatars/foto.jpg`).
 * Frontend (Vite dev server, port 5173) tidak serve `/uploads/` — hanya backend
 * (port 4000) yang melayani file statis tersebut. Jika `src` <img> diset
 * relatif, browser akan me-request dari origin frontend → 404 broken image.
 *
 * Helper ini memastikan avatar yang sudah di-upload dapat ditampilkan dengan
 * menyambungkan `API_URL` (origin backend) ke path relatif.
 * Jika URL sudah absolute (http/https), dikembalikan apa adanya.
 */
export function getImageUrl(relativeUrl: string | null | undefined): string | undefined {
  if (!relativeUrl) return undefined;
  // Jika sudah absolute URL (http/https) atau protocol-relative (//), gunakan langsung
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('//')) {
    return relativeUrl;
  }
  // Relative path — gabungkan dengan API base URL, normalkan slash agar
  // tidak menghasilkan "//" ketika API_URL berakhir dengan trailing slash
  // (mis. VITE_API_URL=http://localhost:4000/ + /uploads/...)
  const baseUrl = API_URL.replace(/\/+$/, '');
  const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  return `${baseUrl}${path}`;
}
