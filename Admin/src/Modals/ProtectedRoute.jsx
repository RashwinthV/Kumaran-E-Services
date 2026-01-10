import { Navigate, Outlet } from "react-router-dom";
import UniversalLoader from "../Components/Loading/UniversalLoader";
import { useAuth } from "../Context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <UniversalLoader
        title="Checking Access..."
        message="Verifying your permissions..."
      />
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />; // <-- IMPORTANT
};

export default ProtectedRoute;
