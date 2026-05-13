import API from "./api";

export const adminAPI = {
  getStats: () => API.get("/admin/stats"),
  getUsers: () => API.get("/admin/users"),
  updateUser: (userId, data) => API.put(`/admin/users/${userId}`, data),
  updateUserRole: (userId, payload) => API.put(`/admin/users/${userId}/role`, payload),
  suspendUser: (userId) => API.put(`/admin/users/${userId}/suspend`),
  unsuspendUser: (userId) => API.put(`/admin/users/${userId}/unsuspend`),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  getAllSubmissions: (status) =>
    API.get("/admin/submissions/all", { params: { status } }),
  forceDeleteSubmission: (submissionId) =>
    API.delete(`/admin/submissions/${submissionId}`),
  archiveSubmission: (submissionId) =>
    API.put(`/admin/submissions/${submissionId}/archive`),
  unarchiveSubmission: (submissionId) =>
    API.put(`/admin/submissions/${submissionId}/unarchive`),
  deleteComment: (commentId) => API.delete(`/admin/comments/${commentId}`),
  deletePeerReview: (reviewId) => API.delete(`/admin/reviews/${reviewId}`),
  getRecentActivity: () => API.get("/admin/activity"),
};

export const moderationAPI = {
  getStats: () => API.get("/admin/moderation/stats"),
  getPendingSubmissions: () => API.get("/admin/moderation/pending"),
  moderateSubmission: (submissionId, action, reason) =>
    API.put(`/admin/moderation/submissions/${submissionId}`, { action, reason }),
  getComments: () => API.get("/admin/moderation/comments"),
  deleteComment: (commentId) =>
    API.delete(`/admin/moderation/comments/${commentId}`),
};
