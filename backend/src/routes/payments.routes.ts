import { Router } from "express";

import { wompiCheckout, wompiPaymentStatus, wompiVerifyTransaction, wompiWebhook } from "../controllers/payments.controller";
import { requireAuth } from "../middleware/auth.middleware";

const paymentsRouter = Router();

paymentsRouter.post("/wompi/checkout", requireAuth, wompiCheckout);

paymentsRouter.get("/wompi/status", requireAuth, wompiPaymentStatus);

paymentsRouter.get("/wompi/verify", requireAuth, wompiVerifyTransaction);

paymentsRouter.post("/wompi/webhook", wompiWebhook);

export { paymentsRouter };
