import { Router } from "express";

import { ordersRouter } from "./orders.routes";
import { paymentsRouter } from "./payments.routes";
import { productsRouter } from "./products.routes";
import { usersRouter } from "./users.routes";

const apiRouter = Router();

apiRouter.use("/products", productsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/payments", paymentsRouter);

export { apiRouter };
