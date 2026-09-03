import api from './apiClient';

export const platformService = {
  list: () => api.get('/platforms').then((r) => r.data),
  supported: () => api.get('/platforms/supported').then((r) => r.data),
  connect: (provider) => api.get(`/platforms/${provider}/connect`).then((r) => r.data),
  disconnect: (id) => api.delete(`/platforms/${id}`).then((r) => r.data),
};
