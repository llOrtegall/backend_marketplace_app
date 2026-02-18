import { Router } from "express";

import { wompiCheckout, wompiPaymentStatus, wompiWebhook } from "../controllers/payments.controller";
import { requireAuth } from "../middleware/auth.middleware";

const paymentsRouter = Router();

paymentsRouter.post("/wompi/checkout", requireAuth, wompiCheckout);

paymentsRouter.get("/wompi/status", requireAuth, wompiPaymentStatus);

paymentsRouter.post("/wompi/webhook", wompiWebhook);

export { paymentsRouter };
