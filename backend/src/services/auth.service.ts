import { compare, hash } from "bcryptjs";

import { ServiceError } from "../errors/service.error";
import { User } from "../models";
import type { AuthUserPayload } from "../types/auth";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";

const toAuthPayload = (user: User): AuthUserPayload => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

const sanitizeUser = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildTokenPair = (payload: AuthUserPayload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

type RegisterInput = {
  fullName?: string;
  email?: string;
  password?: string;
};

type LoginInput = {
  email?: string;
  password?: string;
};

type RefreshInput = {
  refreshToken?: string;
};

export class AuthService {
  async register(input: RegisterInput) {
    const { fullName, email, password } = input;

    if (!fullName || !email || !password) {
      throw new ServiceError(400, "fullName, email and password are required");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ServiceError(409, "Email already registered");
    }

    const passwordHash = await hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      password: passwordHash,
      role: "customer",
    });

    const payload = toAuthPayload(user);
    return {
      user: sanitizeUser(user),
      tokens: buildTokenPair(payload),
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    if (!email || !password) {
      throw new ServiceError(400, "email and password are required");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ServiceError(401, "Invalid credentials");
    }

    const passwordMatches = await compare(password, user.password);
    if (!passwordMatches) {
      throw new ServiceError(401, "Invalid credentials");
    }

    const payload = toAuthPayload(user);
    return {
      user: sanitizeUser(user),
      tokens: buildTokenPair(payload),
    };
  }

  async refresh(input: RefreshInput) {
    const { refreshToken } = input;

    if (!refreshToken) {
      throw new ServiceError(400, "refreshToken is required");
    }

    try {
      const tokenPayload = verifyRefreshToken(refreshToken);
      const user = await User.findByPk(tokenPayload.id);

      if (!user) {
        throw new ServiceError(401, "Invalid refresh token");
      }

      const payload = toAuthPayload(user);
      return {
        tokens: buildTokenPair(payload),
      };
    } catch {
      throw new ServiceError(401, "Invalid refresh token");
    }
  }

  async me(userId?: string) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    return {
      user: sanitizeUser(user),
    };
  }
}

export const authService = new AuthService();