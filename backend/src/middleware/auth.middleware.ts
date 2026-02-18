import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth";
import type { AuthRole, AuthUserPayload } from "../types/auth";

export type AuthenticatedRequest = Request & {
  user?: AuthUserPayload;
};

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = session.user.role;
    if (userRole !== "admin" && userRole !== "customer") {
      return res.status(403).json({ message: "Invalid user role" });
    }

    req.user = {
      id: String(session.user.id),
      email: String(session.user.email),
      role: userRole,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

export const requireRole = (roles: AuthRole[]) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  return next();
};

export const requireAdmin = requireRole(["admin"]);
