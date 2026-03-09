import { ApiResponse } from "@lib/response";
import { Router } from "express";
import { ApiV1Route } from "./v1";

export class ApiRoute {
  private static path = Router();

  public static draw() {
    this.path.get("/health", (_req, res) => {
      ApiResponse.sendOk(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    this.path.use("/v1", ApiV1Route.draw());

    return this.path;
  }
}
