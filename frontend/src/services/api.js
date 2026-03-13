import axios from 'axios';


// aik axios ka instance create krna hai pehly 
const API = axios.create({
  baseURL: 'https://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor  -- adding token to every request 
 
API.interceptor.request().use((config)=>{ 
const token = localstorage.getItem('accessToken');
if(token){
  config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
// handle token expiration 
API.interceptor.response.use(
  (response) => response,
  async (error)=>{
    const originalRequest = error.config;
    if(error.response.status === 401 && !originalRequest._retry){
      originalRequest._retry = true;
      try{
        const refreshToken = localStorage.getItem('refreshToken');
        if(refreshToken){
        const response = await API.post('/auth/refresh-token', { refreshToken });
        localstorage.setItem('accessToken', response.data.accessToken);
        localstorage.setItem('refreshToken', response.data.refreshToken);
        originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
        return API(originalRequest);
        }
      }catch(err){
        localstorage.clear();
        window.location.href='/login';
      }
  }
  return Promise.reject(error);
}
);

export const authAPI= {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  refreshToken: (refreshToken) => API.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  getCurrentUser: () => API.get('/auth/me'), // from protected route 
}

export default API;
