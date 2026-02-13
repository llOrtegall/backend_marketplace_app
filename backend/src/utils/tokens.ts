import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import type { AuthUserPayload } from "../types/auth";

const accessSecret = process.env.JWT_ACCESS_SECRET ?? "dev_access_secret_change_me";
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret_change_me";
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

const signToken = (
  payload: AuthUserPayload,
  secret: string,
  expiresIn: string,
) => jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const signAccessToken = (payload: AuthUserPayload) =>
  signToken(payload, accessSecret, accessExpiresIn);

export const signRefreshToken = (payload: AuthUserPayload) =>
  signToken(payload, refreshSecret, refreshExpiresIn);

const verifyToken = (token: string, secret: string): AuthUserPayload => {
  const decoded = jwt.verify(token, secret) as JwtPayload;

  return {
    id: String(decoded.id),
    email: String(decoded.email),
    role: decoded.role as AuthUserPayload["role"],
  };
};

export const verifyAccessToken = (token: string) => verifyToken(token, accessSecret);

export const verifyRefreshToken = (token: string) => verifyToken(token, refreshSecret);
