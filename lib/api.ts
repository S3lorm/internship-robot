// Re-export Supabase API functions
// This file maintains backward compatibility with existing code
export * from './supabase/api';

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: Record<string, unknown>) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  verifyEmail: (token: string) =>
    fetchApi('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email: string) =>
    fetchApi('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  // Uses /auth/me endpoint on the backend
  getProfile: () => fetchApi('/auth/me'),

  updateProfile: (data: Record<string, unknown>) =>
    fetchApi('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return fetch(`${API_BASE_URL}/profile/avatar`, {
      method: 'POST',
      headers:
        typeof window !== 'undefined' && localStorage.getItem('rmu_token')
          ? { Authorization: `Bearer ${localStorage.getItem('rmu_token')}` }
          : undefined,
      body: formData,
    }).then(async res => {
      const json = await res.json();
      if (!res.ok) {
        return { error: json.message || 'Failed to upload avatar' };
      }
      return { data: json };
    });
  },
};

// Internships API
export const internshipsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi(`/internships${query}`);
  },

  getById: (id: string) => fetchApi(`/internships/${id}`),

  create: (data: Record<string, unknown>) =>
    fetchApi('/internships', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/internships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi(`/internships/${id}`, {
      method: 'DELETE',
    }),
};

// Applications API
export const applicationsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi(`/applications${query}`);
  },

  getById: (id: string) => fetchApi(`/applications/${id}`),

  getMyApplications: () => fetchApi('/applications/my'),

  create: (data: FormData) =>
    // Use raw fetch to support multipart/form-data, but still attach auth token
    fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers:
        typeof window !== 'undefined' && localStorage.getItem('rmu_token')
          ? { Authorization: `Bearer ${localStorage.getItem('rmu_token')}` }
          : undefined,
      body: data,
    }).then(async res => {
      const json = await res.json();
      if (!res.ok) {
        return { error: json.message || 'An error occurred' };
      }
      return { data: json };
    }),

  updateStatus: (id: string, status: string, notes?: string) =>
    fetchApi(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, feedback: notes }),
    }),

  bulkUpdateStatus: (ids: string[], status: string) =>
    fetchApi('/applications/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),

  withdraw: (id: string) =>
    fetchApi(`/applications/${id}/withdraw`, {
      method: 'PATCH',
    }),
};

// Notices API
export const noticesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi(`/notices${query}`);
  },

  getById: (id: string) => fetchApi(`/notices/${id}`),

  create: (data: Record<string, unknown>) =>
    fetchApi('/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/notices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi(`/notices/${id}`, {
      method: 'DELETE',
    }),
};

// Notifications API
export const notificationsApi = {
  getAll: () => fetchApi('/notifications'),

  markAsRead: (id: string) =>
    fetchApi(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllAsRead: () =>
    fetchApi('/notifications/read-all', {
      method: 'PATCH',
    }),
};

// Letters API
export const lettersApi = {
  generate: (internshipId?: string) => {
    const url = internshipId 
      ? `/letters/generate?internshipId=${internshipId}`
      : '/letters/generate';
    return fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers:
        typeof window !== 'undefined' && localStorage.getItem('rmu_token')
          ? { Authorization: `Bearer ${localStorage.getItem('rmu_token')}` }
          : undefined,
    }).then(async res => {
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to generate letter');
      }
      return res.text();
    });
  },

  download: (internshipId?: string, format: string = 'html') => {
    const url = internshipId 
      ? `/letters/download?internshipId=${internshipId}&format=${format}`
      : `/letters/download?format=${format}`;
    return fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers:
        typeof window !== 'undefined' && localStorage.getItem('rmu_token')
          ? { Authorization: `Bearer ${localStorage.getItem('rmu_token')}` }
          : undefined,
    }).then(async res => {
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to download letter');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Internship_Letter_${new Date().getTime()}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    });
  },
};

// Analytics API (Admin only)
export const analyticsApi = {
  getDashboardStats: () => fetchApi('/analytics/dashboard'),

  // Backend exposes /analytics/applications (aggregated by status, etc.)
  getApplicationsByMonth: () => fetchApi('/analytics/applications'),

  // Backend exposes /analytics/internships
  getInternshipsByCategory: () => fetchApi('/analytics/internships'),

  exportApplications: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    // Use backend's /applications/export CSV endpoint
    return fetch(`${API_BASE_URL}/applications/export${query}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('rmu_token')}`,
      },
    });
  },
};

// Users API (Admin only)
export const usersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi(`/users${query}`);
  },

  getById: (id: string) => fetchApi(`/users/${id}`),

  updateStatus: (id: string, isActive: boolean) =>
    fetchApi(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  delete: (id: string) =>
    fetchApi(`/users/${id}`, {
      method: 'DELETE',
    }),
};
