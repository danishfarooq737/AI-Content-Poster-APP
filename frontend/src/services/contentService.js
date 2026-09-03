import api from './apiClient';

export const contentService = {
  list: (params) => api.get('/content', { params }).then((r) => r.data),
  get: (id) => api.get(`/content/${id}`).then((r) => r.data),
  update: (id, payload) => api.put(`/content/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/content/${id}`).then((r) => r.data),
  clipSupported: () => api.get('/content/clip/supported').then((r) => r.data),
  startClip: (videoUrl) => api.post('/content/clip', { videoUrl }).then((r) => r.data),
  listClipJobs: () => api.get('/content/clip-jobs').then((r) => r.data),
};
