import { NextFunction, Request, Response } from "express";
import { ApplicationController } from "../../application.controller";

export class HealthCheckController extends ApplicationController {
  public index(req: Request, res: Response, next: NextFunction) {
    const healthCheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: Date.now(),
    };

    try {
      res.json(healthCheck);
    } catch (error: any) {
      healthCheck.message = error.message;
      res.status(503).json(healthCheck);
    }
  }
}
