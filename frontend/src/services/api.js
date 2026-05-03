import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, tokens = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(tokens);
    }
  });
  failedQueue = [];
};

const getStoredTokens = () => {
  const storedTokens =
    localStorage.getItem("authTokens") ||
    sessionStorage.getItem("authTokens");
  try {
    return storedTokens ? JSON.parse(storedTokens) : {};
  } catch {
    return {};
  }
};

const saveTokens = (newTokens) => {
  if (localStorage.getItem("authTokens")) {
    localStorage.setItem("authTokens", JSON.stringify(newTokens));
  } else {
    sessionStorage.setItem("authTokens", JSON.stringify(newTokens));
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch {
    return true;
  }
};

// API instance configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Auth endpoints that should bypass all token refresh logic
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/refresh-token",
];

const isAuthEndpoint = (url) => {
  return AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
};

// Request Interceptor - attach token and proactively refresh if expired
API.interceptors.request.use(
  async (config) => {
    if (isAuthEndpoint(config.url)) {
      return config;
    }

    const { accessToken, refreshToken } = getStoredTokens();

    if (accessToken && !isTokenExpired(accessToken)) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
      return config;
    }

    if (accessToken && isTokenExpired(accessToken) && refreshToken) {
      try {
        const response = await axios.post(
          `${config.baseURL || "http://localhost:3000"}/auth/refresh-token`,
          { refreshToken }
        );
        const newTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
        saveTokens(newTokens);
        config.headers["Authorization"] = `Bearer ${newTokens.accessToken}`;

        window.dispatchEvent(
          new CustomEvent("auth:tokensRefreshed", { detail: newTokens })
        );

        return config;
      } catch (err) {
        localStorage.removeItem("authTokens");
        sessionStorage.removeItem("authTokens");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    }

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - handle 401 with queue to prevent race conditions
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Never attempt token refresh on auth endpoints or refresh-token itself
      if (
        originalRequest.url?.includes("/auth/refresh-token") ||
        isAuthEndpoint(originalRequest.url)
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((tokens) => {
            originalRequest.headers["Authorization"] = `Bearer ${tokens.accessToken}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const response = await API.post("/auth/refresh-token", {
          refreshToken,
        });

        const newTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };

        saveTokens(newTokens);

        window.dispatchEvent(
          new CustomEvent("auth:tokensRefreshed", { detail: newTokens })
        );

        processQueue(null, newTokens);

        originalRequest.headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("authTokens");
        sessionStorage.removeItem("authTokens");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
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

// Post Interaction API functions
export const getPostComments = (submissionId) =>
  API.get(`/posts/${submissionId}/comments`);
export const addPostComment = (submissionId, content) =>
  API.post(`/posts/${submissionId}/comments`, { content });
export const deletePostComment = (commentId) =>
  API.delete(`/posts/comments/${commentId}`);
export const getPostLikes = (submissionId) =>
  API.get(`/posts/${submissionId}/likes`);
export const getUserPostLike = (submissionId) =>
  API.get(`/posts/${submissionId}/likes/me`);
export const togglePostLike = (submissionId) =>
  API.post(`/posts/${submissionId}/likes`);
export const getPostShares = (submissionId) =>
  API.get(`/posts/${submissionId}/shares`);
export const togglePostShare = (submissionId) =>
  API.post(`/posts/${submissionId}/shares`);
export const getPostSaves = (submissionId) =>
  API.get(`/posts/${submissionId}/saves`);
export const getUserPostSave = (submissionId) =>
  API.get(`/posts/${submissionId}/saves/me`);
export const togglePostSave = (submissionId) =>
  API.post(`/posts/${submissionId}/saves`);

// Peer Review API functions
export const getSubmissionReviews = (submissionId) =>
  API.get(`/posts/${submissionId}/reviews`);
export const getUserReview = (submissionId) =>
  API.get(`/posts/${submissionId}/reviews/me`);
export const getAggregateScores = (submissionId) =>
  API.get(`/posts/${submissionId}/reviews/aggregate`);
export const submitPeerReview = (submissionId, payload) =>
  API.post(`/posts/${submissionId}/reviews`, payload);

export default API;
