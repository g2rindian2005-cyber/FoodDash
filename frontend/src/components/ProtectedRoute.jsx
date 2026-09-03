import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards routes that need a logged-in user.
 * Pass ownerOnly to also require role === 'owner'.
 */
export default function ProtectedRoute({ children, ownerOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    // Remember where the user wanted to go, then send to login.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (ownerOnly && user.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return children;
}
