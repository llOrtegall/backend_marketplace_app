import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import express from "express";
import logger from "morgan";
import cors from "cors";

import { apiRouter } from "./routes";

export const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGINS ?? "http://localhost:5173",
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

app.use("/api/v1", apiRouter);

app.get("/api/auth/error", (req, res) => {
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  const errorCode = Array.isArray(req.query.error) ? req.query.error[0] : req.query.error;
  const authStatus = errorCode === "access_denied" ? "cancelled" : "error";
  res.redirect(`${frontendOrigin}/?auth=${authStatus}`);
});

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});
