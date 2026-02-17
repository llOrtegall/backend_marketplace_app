import { Router } from "express";

import { paymentsRouter } from "./payments.routes";
import { productsRouter } from "./products.routes";

const apiRouter = Router();

apiRouter.use("/products", productsRouter);
// apiRouter.use("/payments", paymentsRouter);

export { apiRouter };
