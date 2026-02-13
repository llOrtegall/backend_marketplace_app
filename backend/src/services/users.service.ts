import { ServiceError } from "../errors/service.error";
import { User } from "../models";
import type { AuthUserPayload } from "../types/auth";

const sanitizeUser = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

type UpdateUserInput = {
  fullName?: string;
  role?: "admin" | "customer";
};

export class UsersService {
  async listUsers() {
    const users = await User.findAll({ order: [["createdAt", "DESC"]] });
    return { data: users.map(sanitizeUser) };
  }

  async getUserById(id: string, actor?: AuthUserPayload) {
    if (actor?.role !== "admin" && actor?.id !== id) {
      throw new ServiceError(403, "Insufficient permissions");
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    return { data: sanitizeUser(user) };
  }

  async updateUserById(id: string, input: UpdateUserInput, actor?: AuthUserPayload) {
    if (actor?.role !== "admin" && actor?.id !== id) {
      throw new ServiceError(403, "Insufficient permissions");
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    if (input.fullName !== undefined) {
      user.fullName = input.fullName;
    }

    if (input.role !== undefined && actor?.role === "admin") {
      user.role = input.role;
    }

    await user.save();
    return { data: sanitizeUser(user) };
  }

  async deleteUserById(id: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    await user.destroy();
    return { message: "User deleted" };
  }
}

export const usersService = new UsersService();