import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  sendAIChat: (data) => apiClient.post('/ai/chat', data),
  deleteLogs: () => apiClient.delete('/logs'),
  deleteUpload: (uploadId) => apiClient.delete(`/uploads/${uploadId}`),
  loadDemoData: () => apiClient.post('/demo/load'),
};
