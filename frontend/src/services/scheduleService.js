import api from './apiClient';

export const scheduleService = {
  create: (payload) => api.post('/schedules', payload).then((r) => r.data),
  list: (params) => api.get('/schedules', { params }).then((r) => r.data),
  cancel: (id) => api.delete(`/schedules/${id}`).then((r) => r.data),
};
