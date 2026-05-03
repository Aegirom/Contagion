import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ModeratorRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-toxic border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'Administrator' && user?.role !== 'Moderator')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ModeratorRoute;
