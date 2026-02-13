import { Router } from "express";

import { deleteUserById, getUserById, listUsers, updateUserById } from "../controllers/users.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const usersRouter = Router();

usersRouter.get("/", requireAuth, requireRole(["admin"]), listUsers);

usersRouter.get("/:id", requireAuth, getUserById);

usersRouter.put("/:id", requireAuth, updateUserById);

usersRouter.delete("/:id", requireAuth, requireRole(["admin"]), deleteUserById);

export { usersRouter };
