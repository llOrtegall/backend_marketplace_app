import { Router } from "express";

import { ordersRouter } from "./orders.routes";
import { paymentsRouter } from "./payments.routes";
import { productsRouter } from "./products.routes";

const apiRouter = Router();

apiRouter.use("/products", productsRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/orders", ordersRouter);

export { apiRouter };
