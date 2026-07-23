import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const apiService = {
  checkHealth: () => apiClient.get('/'),
  getDashboard: () => apiClient.get('/dashboard'),
  getLogs: (params) => apiClient.get('/logs', { params }),
  getLogMetadata: () => apiClient.get('/logs/meta'),
  uploadLogs: (formData) =>
    apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  analyzeLogs: (data) => apiClient.post('/analyze', data),
  sendChat: (data) => apiClient.post('/chat', data),
};
