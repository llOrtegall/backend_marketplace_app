import cors from "cors";
import express from "express";
import logger from "morgan";

import { apiRouter } from "./routes";

export const app = express();

app.use(cors());
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

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});
