import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Wrap any route with <ProtectedRoute> to require login.
// While the auth state is being restored from localStorage, show a
// loading screen so we don't flash the login page unnecessarily.
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
