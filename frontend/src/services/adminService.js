import api from './apiClient';

export const dashboardService = {
  get: () => api.get('/dashboard').then((r) => r.data),
};

export const adminService = {
  listUsers: () => api.get('/users').then((r) => r.data),
  stats: () => api.get('/users/stats').then((r) => r.data),
  updateUser: (id, payload) => api.patch(`/users/${id}`, payload).then((r) => r.data),
  deleteUser: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};
