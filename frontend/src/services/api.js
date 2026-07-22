import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  checkHealth: () => apiClient.get('/'),
  getDashboard: () => apiClient.get('/dashboard'),
  uploadLogs: (data) => apiClient.post('/upload', data),
  analyzeLogs: (data) => apiClient.post('/analyze', data),
  sendChat: (data) => apiClient.post('/chat', data),
};
