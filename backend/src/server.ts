import { PORT, CORS_ORIGINS, FRONTEND_ORIGIN } from "./schema/envSchema";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import express from "express";
import logger from "morgan";
import cors from "cors";

import { apiRouter } from "./routes";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
}));
app.use(express.json());
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ecommerce-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/auth/error", (req, res) => {
  const frontendOrigin = FRONTEND_ORIGIN;
  const errorCode = Array.isArray(req.query.error) ? req.query.error[0] : req.query.error;
  const authStatus = errorCode === "access_denied" ? "cancelled" : "error";
  res.redirect(`${frontendOrigin}/?auth=${authStatus}`);
});

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use("/api/v1", apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});