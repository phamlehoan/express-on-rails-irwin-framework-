import { ApiResponse, RailsRoute } from "@lib";
import { ApiV1Route } from "./v1";

export class ApiRoute extends RailsRoute {
  public draw() {
    this.get("/health", (_req, res) => {
      ApiResponse.sendOk(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    this.path("/v1", ApiV1Route.draw());
  }
}
