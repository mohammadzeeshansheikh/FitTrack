import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fittrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected network error occurred.';
    if (error.response) {
      if (error.response.status === 404) {
        message = 'Requested resource not found on server.';
      } else if (error.response.status === 500) {
        message = 'Server error. Please verify backend state.';
      } else if (error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
    } else if (error.request) {
      message = 'Unable to reach backend API at http://localhost:5000. Please make sure json-server is running.';
    } else {
      message = error.message;
    }
    const customError = new Error(message);
    customError.originalError = error;
    return Promise.reject(customError);
  }
);

export default axiosInstance;
