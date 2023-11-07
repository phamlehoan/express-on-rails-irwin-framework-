import { Router } from "express";
import { HealthCheckController } from "../../../app/controllers";

export class ApiRoute {
  private static path = Router();
  private static healthCheckController = new HealthCheckController();

  public static draw() {
    this.path.route("/health").get(this.healthCheckController.index);

    return this.path;
  }
}
