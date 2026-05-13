const apiConfig = {
  development: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 10000,
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL || 'https://your-backend-url.com',
    timeout: 10000,
  },
  test: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 5000,
  },
};

export default apiConfig;
