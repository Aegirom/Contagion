// App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./AppLayout/Auth/LoginPage";
import RegisterPage from "./AppLayout/Auth/RegisterPage";
import ForgotPasswordPage from "./AppLayout/Auth/ForgotPasswordPage";
import VerifyEmailPage from "./AppLayout/Auth/VerifyEmailPage";
import ResetPasswordPage from "./AppLayout/Auth/ResetPasswordPage";
import DashboardPage from "./AppLayout/Dashboard/DashboardPage";
import FeedPage from "./AppLayout/Feed/FeedPage";
import CreatePost from "./AppLayout/CreatePost/CreatePost";
import SubmissionsPage from "./AppLayout/SubmissionsPage/SubmissionsPage";
import AiEvaluationPage from "./AppLayout/AiEvaluation/AiEvaluationPage";
import AdminDashboardPage from "./AppLayout/Dashboard/AdminDashboardPage";
import ProfilePage from "./AppLayout/Profile/ProfilePage";
import { AuthProvider } from "./context/AuthContext";
import AdminRoute from "./AppLayout/AdminRoute";
import PrivateRoute from "./AppLayout/PrivateRoute";
import Leaderboard from "./AppLayout/Leaderboard/Leaderboard";
import Post from "./AppLayout/Post/Post";
import Drafts from "./AppLayout/Drafts/Drafts";
import MainLayout from "./AppLayout/MainLayout";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Dashboard"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <DashboardPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/submissions"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Submissions"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <SubmissionsPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Leaderboard"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <Leaderboard />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/post/:postId"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Post"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <Post />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/submissions/:submissionId/ai-evaluation"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="AI Evaluation"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <AiEvaluationPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <MainLayout
                pageName="Admin"
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
              >
                <PrivateRoute>
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                </PrivateRoute>
              </MainLayout>
            }
          />

          <Route
            path="/feed"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Feed"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <FeedPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/create-post"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Create Analysis"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <CreatePost />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/drafts"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Drafts"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <Drafts />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <MainLayout
                  pageName="Profile"
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                >
                  <ProfilePage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/feed" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
