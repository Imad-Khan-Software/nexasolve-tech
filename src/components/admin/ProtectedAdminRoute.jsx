import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Loading } from '../common/Loading.jsx';

/**
 * Wrap any admin route element with this. Renders nothing but a loading
 * state until the session + admin_user check resolves, so unauthorized
 * users never see a flash of dashboard content before being redirected.
 */
export function ProtectedAdminRoute({ children }) {
  const { status } = useAdminAuth();

  if (status === 'loading') {
    return <Loading fullscreen label="Checking your session…" />;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
