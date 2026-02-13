export type AuthRole = "admin" | "customer";

export type AuthUserPayload = {
  id: string;
  email: string;
  role: AuthRole;
};
