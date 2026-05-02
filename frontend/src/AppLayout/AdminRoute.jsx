import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Admin-only route component that checks if user has Administrator role
 * Redirects to dashboard if user is not an admin
 */
const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-toxic border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  // Check if user is authenticated and has Administrator role
  if (!isAuthenticated || user?.role !== 'Administrator') {
    // Redirect non-admins to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;

