import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectPath = '/login',
}) => {
  const { isAuthenticated, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0052CC] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = roles.some((userRole) =>
      allowedRoles.some(
        (allowed) =>
          userRole.toUpperCase() === allowed.toUpperCase() ||
          userRole.toUpperCase() === `ROLE_${allowed.toUpperCase()}`
      )
    );

    if (!hasRole) {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};
