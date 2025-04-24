import { Router } from "express";
import { ApiV1Route } from "./v1";

export class ApiRoute {
  private static path = Router();

  public static draw() {
    this.path.use("/v1", ApiV1Route.draw());

    return this.path;
  }
}
