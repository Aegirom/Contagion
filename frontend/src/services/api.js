import axios from "axios";

// API instance configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor - adding token to every request
API.interceptors.request.use(
  (config) => {
    const storedTokens =
      localStorage.getItem("authTokens") ||
      sessionStorage.getItem("authTokens");
    let parsedTokens = {};
    try {
      parsedTokens = storedTokens ? JSON.parse(storedTokens) : {};
    } catch {
      parsedTokens = {};
    }
    const token = parsedTokens.accessToken;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor - handle token expiration
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await API.post("/auth/refresh-token", {
            refreshToken,
          });
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);
          originalRequest.headers["Authorization"] =
            `Bearer ${response.data.accessToken}`;
          return API(originalRequest);
        }
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);

// Auth API functions
export const authAPI = {
  register: (userData) => API.post("/auth/register", userData),
  login: (credentials) => API.post("/auth/login", credentials),
  refreshToken: (refreshToken) =>
    API.post("/auth/refresh-token", { refreshToken }),
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  getCurrentUser: () => API.get("/auth/me"),
};

// User Submissions API functions
export const getAllSubmissions = () => API.get("/submissions/get");
export const getUserSubmissions = () => API.get("/submissions/mine");
export const getUserStats = () => API.get("/submissions/stats");
export const getUserDrafts = () => API.get("/submissions/drafts");
export const getSubmissionById = (id) => API.get(`/submissions/${id}`);
export const createSubmission = (payload) =>
  API.post("/submissions/post", payload);
export const updateSubmission = (id, payload) =>
  API.patch(`/submissions/${id}`, payload);
export const deleteSubmission = (id) => API.delete(`/submissions/${id}`);

// Artifact API functions
export const uploadArtifact = (formData, onUploadProgress) =>
  API.post("/artifacts/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
export const getArtifacts = () => API.get("/artifacts");
export const getArtifactDownloadUrl = (id) =>
  API.get(`/artifacts/${id}/download`);

// Dashboard API functions
export const getDashboardActivity = () => API.get("/dashboard/activity");
export const getAnalystReputation = () => API.get("/dashboard/reputation");
export const getQuickActions = () => API.get("/dashboard/quick-actions");

// Sandbox API functions
export const getSandboxSubmissions = () => API.get("/sandbox/submissions");
export const getSandboxExecutions = () => API.get("/sandbox/executions");
export const evaluateSandboxFile = (payload) =>
  API.post("/sandbox/evaluate", payload);

export default API;
