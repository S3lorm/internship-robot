// API base URL - configure this for your backend
// In browser, NEXT_PUBLIC_* vars are available at runtime
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser: use the env var from .env.local (set at build time)
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  // Server-side: use env var or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to make API requests
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rmu_token') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    // Debug logging - always log in browser to help troubleshoot
    if (typeof window !== 'undefined') {
      console.log(`[API] ${options.method || 'GET'} ${fullUrl}`, { 
        API_BASE_URL, 
        endpoint,
        envVar: process.env.NEXT_PUBLIC_API_URL,
        fullUrl 
      });
    }

    let response;
    try {
      response = await fetch(fullUrl, {
        ...options,
        headers,
        mode: 'cors', // Explicitly enable CORS
      });
    } catch (error) {
      // Network error - backend might be down or CORS issue
      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      console.error(`[API] Network error calling ${fullUrl}:`, errorMessage);
      console.error(`[API] Check if backend is running on ${API_BASE_URL}`);
      return {
        error: `Failed to connect to backend. Please ensure the backend server is running on ${API_BASE_URL}. Error: ${errorMessage}`,
      };
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    if (isJson) {
      data = await response.json();
    } else {
      // If we get HTML (like a 404 page), return a helpful error
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      return { 
        error: response.status === 404 
          ? 'API endpoint not found. Please check your backend is running.' 
          : `Server returned ${response.status}: ${response.statusText}` 
      };
    }

    if (!response.ok) {
      return { error: data.message || data.error || `Error ${response.status}: ${response.statusText}` };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        return { 
          error: `Cannot connect to backend at ${API_BASE_URL}. Please ensure the backend server is running on port 5000.` 
        };
      }
    }
    return { error: error instanceof Error ? error.message : 'Network error. Please try again.' };
  }
}

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

  resetPassword: (email: string, token: string, password: string) =>
    fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, password }),
    }),

  // Uses /auth/me endpoint on the backend
  getProfile: () => fetchApi('/auth/me'),

  updateProfile: (data: Record<string, unknown>) =>
    fetchApi('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetchApi('/profile/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getPreferences: () => fetchApi('/profile/preferences'),

  updatePreferences: (preferences: Record<string, unknown>) =>
    fetchApi('/profile/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
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
        return { error: json.message || json.error || 'Failed to upload avatar' };
      }
      return { data: json };
    }).catch(error => {
      return { error: error.message || 'Network error while uploading avatar' };
    });
  },

  removeAvatar: () =>
    fetchApi('/profile/avatar', {
      method: 'DELETE',
    }),
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

  // Letter Request API
  createRequest: (data: Record<string, unknown>) =>
    fetchApi('/letters/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRequests: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/letters/requests${query}`);
  },

  getRequestById: (id: string) => fetchApi(`/letters/requests/${id}`),

  updateRequest: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/letters/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateRequestStatus: (id: string, status: string, adminNotes?: string, sendEmail?: boolean) =>
    fetchApi(`/letters/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes, sendEmail }),
    }),

  downloadLetterPDF: (id: string) => {
    return fetch(`${API_BASE_URL}/letters/requests/${id}/download`, {
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
      return res.text();
    });
  },

  markEmailSent: (id: string) =>
    fetchApi(`/letters/requests/${id}/mark-email-sent`, {
      method: 'PATCH',
    }),
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

// Reminders API
export const remindersApi = {
  getUpcomingDeadlines: () => fetchApi('/reminders/upcoming'),
  getOverdueItems: () => fetchApi('/reminders/overdue'),
  triggerReminders: () => fetchApi('/reminders/trigger', { method: 'POST' }), // Admin only
};

// Evaluations API
export const evaluationsApi = {
  getAll: () => fetchApi('/evaluations'),
  getById: (id: string) => fetchApi(`/evaluations/${id}`),
  markAsViewed: (id: string) => fetchApi(`/evaluations/${id}/view`, { method: 'PATCH' }),
  acknowledgeFeedback: (id: string) => fetchApi(`/evaluations/${id}/acknowledge`, { method: 'PATCH' }),
  create: (data: Record<string, unknown>) =>
    fetchApi('/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/evaluations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Logbooks API
export const logbooksApi = {
  getAll: () => fetchApi('/logbooks'),
  getById: (id: string) => fetchApi(`/logbooks/${id}`),
  submit: (id: string, data: any) => fetchApi(`/logbooks/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markFeedbackViewed: (id: string) => fetchApi(`/logbooks/${id}/view-feedback`, { method: 'PATCH' }),
  acknowledgeFeedback: (id: string) => fetchApi(`/logbooks/${id}/acknowledge-feedback`, { method: 'PATCH' }),
};

// Reports API
export const reportsApi = {
  getAll: () => fetchApi('/reports'),
  getById: (id: string) => fetchApi(`/reports/${id}`),
  submit: (id: string, data: any) => fetchApi(`/reports/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markFeedbackViewed: (id: string) => fetchApi(`/reports/${id}/view-feedback`, { method: 'PATCH' }),
  acknowledgeFeedback: (id: string) => fetchApi(`/reports/${id}/acknowledge-feedback`, { method: 'PATCH' }),
};

// Administrative Actions API
export const administrativeActionsApi = {
  getAll: () => fetchApi('/administrative-actions'),
  getById: (id: string) => fetchApi(`/administrative-actions/${id}`),
  markAsCompleted: (id: string) => fetchApi(`/administrative-actions/${id}/complete`, { method: 'PATCH' }),
};
