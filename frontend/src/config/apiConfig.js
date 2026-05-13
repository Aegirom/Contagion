const apiConfig = {
  development: {
    baseURL: import.meta.env.VITE_API_URL || 'http://contagion.eu-north-1.elasticbeanstalk.com',
    timeout: 10000,
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL || 'http://contagion.eu-north-1.elasticbeanstalk.com',
    timeout: 10000,
  },
  test: {
    baseURL: import.meta.env.VITE_API_URL || 'http://contagion.eu-north-1.elasticbeanstalk.com',
    timeout: 5000,
  },
};

export default apiConfig;
