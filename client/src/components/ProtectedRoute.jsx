import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
