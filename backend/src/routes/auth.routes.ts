import { Router } from "express";

import { login, me, refresh, register } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", register);

authRouter.post("/login", login);

authRouter.post("/refresh", refresh);

authRouter.get("/me", requireAuth, me);

export { authRouter };
