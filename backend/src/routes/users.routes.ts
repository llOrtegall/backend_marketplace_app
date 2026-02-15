import { Router } from "express";

import { deleteUserById, getUserById, listUsers, updateUserById } from "../controllers/users.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const usersRouter = Router();

usersRouter.get("/", requireAuth, requireAdmin, listUsers);

usersRouter.get("/:id", requireAuth, requireAdmin, getUserById);

usersRouter.put("/:id", requireAuth, requireAdmin, updateUserById);

usersRouter.delete("/:id", requireAuth, requireAdmin, deleteUserById);

export { usersRouter };
