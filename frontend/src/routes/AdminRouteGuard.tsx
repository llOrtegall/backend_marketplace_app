import { Navigate, useLocation } from "react-router";

import { useSession } from "@/lib/auth-client";

type SessionWithRole = {
  user?: {
    role?: string;
  };
};

type AdminRouteGuardProps = {
  children: React.ReactNode;
};

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const location = useLocation();
  const { data, isPending } = useSession();
  const session = data as SessionWithRole | null;

  if (isPending) {
    return <div className="min-h-screen grid place-items-center text-sm">Validando acceso...</div>;
  }

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (session.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}