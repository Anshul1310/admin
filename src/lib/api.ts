import axios from 'axios';
import type { ApiResponse, DashboardStats, AdminUser, User, Team, Payment, Pagination } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach admin token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If we got 401 on protected admin route, clear token
      const isAuthRoute = error.config?.url?.includes('/admin/auth/google') || error.config?.url?.includes('/admin/auth/dev-login');
      if (!isAuthRoute) {
        localStorage.removeItem('tf_admin_token');
        localStorage.removeItem('tf_admin_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    googleLogin: async (credential: string) => {
      const { data } = await apiClient.post<ApiResponse<{ token: string; admin: AdminUser }>>('/api/admin/auth/google', { credential });
      return data;
    },
    devLogin: async (email: string) => {
      const { data } = await apiClient.post<ApiResponse<{ token: string; admin: AdminUser }>>('/api/admin/auth/dev-login', { email });
      return data;
    },
    getMe: async () => {
      const { data } = await apiClient.get<ApiResponse<AdminUser>>('/api/admin/auth/me');
      return data;
    },
    logout: async () => {
      const { data } = await apiClient.post<ApiResponse>('/api/admin/auth/logout');
      return data;
    },
  },

  // Dashboard
  dashboard: {
    getStats: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats');
      return data;
    },
  },

  // Users
  users: {
    list: async (params?: { search?: string; hostel?: string; mess?: string; gender?: string; has_team?: string; page?: number; limit?: number }) => {
      const { data } = await apiClient.get<ApiResponse<{ users: User[]; pagination: Pagination }>>('/api/admin/users', { params });
      return data;
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<ApiResponse<{ user: User; team?: Team }>>(`/api/admin/users/${id}`);
      return data;
    },
    update: async (id: string, payload: Partial<User>) => {
      const { data } = await apiClient.put<ApiResponse>(`/api/admin/users/${id}`, payload);
      return data;
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse>(`/api/admin/users/${id}`);
      return data;
    },
    exportCsvUrl: () => `${API_BASE_URL}/api/admin/users/export`,
    downloadCsv: async () => {
      const response = await apiClient.get('/api/admin/users/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transfinitte_users_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  },

  // Teams
  teams: {
    list: async (params?: { search?: string; domain?: string; payment_status?: string; is_public?: string; page?: number; limit?: number }) => {
      const { data } = await apiClient.get<ApiResponse<{ teams: Team[]; pagination: Pagination }>>('/api/admin/teams', { params });
      return data;
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<ApiResponse<Team>>(`/api/admin/teams/${id}`);
      return data;
    },
    update: async (id: string, payload: Partial<Team>) => {
      const { data } = await apiClient.put<ApiResponse>(`/api/admin/teams/${id}`, payload);
      return data;
    },
    updatePaymentStatus: async (id: string, payment_status: string) => {
      const { data } = await apiClient.patch<ApiResponse>(`/api/admin/teams/${id}/payment-status`, { payment_status });
      return data;
    },
    addMember: async (teamId: string, payload: { user_id?: string; email?: string }) => {
      const { data } = await apiClient.post<ApiResponse>(`/api/admin/teams/${teamId}/members`, payload);
      return data;
    },
    removeMember: async (teamId: string, userId: string) => {
      const { data } = await apiClient.delete<ApiResponse>(`/api/admin/teams/${teamId}/members/${userId}`);
      return data;
    },
    changeLeader: async (teamId: string, new_leader_user_id: string) => {
      const { data } = await apiClient.post<ApiResponse>(`/api/admin/teams/${teamId}/leader`, { new_leader_user_id });
      return data;
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse>(`/api/admin/teams/${id}`);
      return data;
    },
    downloadCsv: async () => {
      const response = await apiClient.get('/api/admin/teams/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transfinitte_teams_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  },

  // Payments
  payments: {
    list: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
      const { data } = await apiClient.get<ApiResponse<{ payments: Payment[]; pagination: Pagination }>>('/api/admin/payments', { params });
      return data;
    },
    verifyManual: async (payload: { team_id: string; amount: number; payment_status: string; transaction_id: string; notes?: string }) => {
      const { data } = await apiClient.post<ApiResponse>('/api/admin/payments/verify', payload);
      return data;
    },
    downloadCsv: async () => {
      const response = await apiClient.get('/api/admin/payments/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transfinitte_payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  },

  // Admins & Roles
  admins: {
    list: async () => {
      const { data } = await apiClient.get<ApiResponse<AdminUser[]>>('/api/admin/admins');
      return data;
    },
    create: async (payload: { email: string; name?: string; role: string; can_manage_users: boolean; can_manage_teams: boolean; can_manage_payments: boolean; can_manage_admins: boolean }) => {
      const { data } = await apiClient.post<ApiResponse<AdminUser>>('/api/admin/admins', payload);
      return data;
    },
    update: async (id: string, payload: { name?: string; role?: string; can_manage_users?: boolean; can_manage_teams?: boolean; can_manage_payments?: boolean; can_manage_admins?: boolean; is_active?: boolean }) => {
      const { data } = await apiClient.put<ApiResponse>(`/api/admin/admins/${id}`, payload);
      return data;
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse>(`/api/admin/admins/${id}`);
      return data;
    }
  }
};
