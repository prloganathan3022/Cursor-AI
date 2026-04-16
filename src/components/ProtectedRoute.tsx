import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isApiMode } from "../config/api";
import { getStoredToken, verifyAccessToken } from "../lib/jwt";
import { readServerAccessClaims } from "../lib/serverJwt";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const token = getStoredToken();
  const tokenValid = token
    ? isApiMode()
      ? !!readServerAccessClaims(token)
      : !!verifyAccessToken(token)
    : false;

  if (!isAuthenticated || !tokenValid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
