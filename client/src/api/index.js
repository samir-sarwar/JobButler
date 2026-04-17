import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jb_token');
      localStorage.removeItem('jb_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (email, password) => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

// Experiences
export const fetchExperiences = async (params) => {
  const response = await api.get('/experiences', { params });
  return response.data;
};

export const fetchExperience = async (id) => {
  const response = await api.get(`/experiences/${id}`);
  return response.data;
};

export const createExperience = async (data) => {
  const response = await api.post('/experiences', data);
  return response.data;
};

export const updateExperience = async (id, data) => {
  const response = await api.put(`/experiences/${id}`, data);
  return response.data;
};

export const deleteExperience = async (id) => {
  const response = await api.delete(`/experiences/${id}`);
  return response.data;
};

// Tailoring
export const tailorResume = async (data) => {
  const response = await api.post('/tailor', data);
  return response.data;
};

export const downloadPdf = (sessionId) =>
  api.get(`/tailor/${sessionId}/pdf`, { responseType: 'blob' });

export const previewPdf = (latex, signal) =>
  api.post('/tailor/preview-pdf', { latex }, { responseType: 'arraybuffer', signal });

// Sessions
export const fetchSessions = async (params) => {
  const response = await api.get('/sessions', { params });
  return response.data;
};

export const fetchSession = async (sessionId) => {
  const response = await api.get(`/tailor/${sessionId}`);
  return response.data;
};

// Resume Upload/Import
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  
  const response = await api.post('/upload/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const confirmResumeImport = async (experiences, personalInfo, updateProfile = true) => {
  const response = await api.post('/upload/resume/confirm', { experiences, personalInfo, updateProfile });
  return response.data;
};

export const bulkCreateExperiences = async (experiences) => {
  const response = await api.post('/experiences/bulk', { experiences });
  return response.data;
};

export default api;
