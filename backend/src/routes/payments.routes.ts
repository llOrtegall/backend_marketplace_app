import { Router } from "express";

import { wompiCheckout, wompiWebhook } from "../controllers/payments.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const paymentsRouter = Router();

paymentsRouter.post("/wompi/checkout", requireAuth, requireAdmin, wompiCheckout);

paymentsRouter.post("/wompi/webhook", wompiWebhook);

export { paymentsRouter };
