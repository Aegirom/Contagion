import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Protected route component that checks if user is authenticated
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  // While auth is initializing, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#22C55E] border-t-transparent mb-4"></div>
          <p className="text-[#475569]">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
