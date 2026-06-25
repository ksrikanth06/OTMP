import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

/**
 * Gates child routes behind authentication. Unauthenticated visitors are sent
 * to /login, preserving where they were headed so they can be returned there.
 */
export function ProtectedRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
