
import axios from 'axios';

// const api = axios.create({ baseURL: '/api', timeout: 30000 });

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:          d => api.post('/auth/login', d),
  register:       d => api.post('/auth/register', d),
  registerCoordinator: d => api.post('/auth/register/coordinator', d),
  me:             () => api.get('/auth/me'),
  changePassword: d => api.post('/auth/change-password', d),
};

export const needsAPI = {
  create:       d          => api.post('/needs', d),
  getAll:       p          => api.get('/needs', { params: p }),
  getMyNeeds:   (status)   => api.get('/needs/my', { params: status ? { status } : {} }),
  getForMap:    ()         => api.get('/needs/map'),
  getById:      id         => api.get(`/needs/${id}`),
  analyze:      id         => api.post(`/needs/${id}/analyze`),
  reanalyze:    id         => api.post(`/needs/${id}/reanalyze`),
  updateStatus: (id, s)    => api.patch(`/needs/${id}/status`, { status: s }),
  getMatches:   id         => api.get(`/needs/${id}/matches`),
  getImages:    id         => api.get(`/needs/${id}/images`),
  delete:       id         => api.delete(`/needs/${id}`),
};

export const reportsAPI = {
  submitImage: fd => api.post('/reports/image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
};

export const volunteersAPI = {
  create:             d              => api.post('/volunteers', d),
  // FIX: explicitly pass availableOnly param so backend receives it correctly
  getAll:             (availableOnly = false) => api.get('/volunteers', {
    params: availableOnly ? { availableOnly: true } : {}
  }),
  getById:            id             => api.get(`/volunteers/${id}`),
  update:             (id, d)        => api.put(`/volunteers/${id}`, d),
  updateAvailability: (id, v)        => api.patch(`/volunteers/${id}/availability`, { available: v }),
};

export const tasksAPI = {
  assign: d => api.post('/tasks', d),
  getAll: status => api.get('/tasks', { params: status ? { status } : {} }),

  updateStatus: (id, s) => api.patch(`/tasks/${id}/status`, { status: s }),


  getByVolunteer: vid => api.get(`/tasks/by-volunteer/${vid}`),

  getByNeed: nid => api.get(`/tasks/by-need/${nid}`),
};


export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const adminAPI = {
  getUsers:     ()           => api.get('/admin/users'),
  createUser:   d            => api.post('/admin/users', d),
  updateStatus: (id, active) => api.patch(`/admin/users/${id}/status`, { active }),
};

export default api;
