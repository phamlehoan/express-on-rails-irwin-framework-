import { ApiResponse, RailsRoute } from "@rails";
import { ApiV1Route } from "./v1";

export class ApiRoute extends RailsRoute {
  public draw() {
    this.route.get("/health", async (_req, res) => {
      const { checkReadiness } = await import("@configs/health");
      const status = await checkReadiness();
      const code = status.status === "ok" ? 200 : 503;
      res.status(code).json(ApiResponse.ok(status));
    });

    this.path("/v1", ApiV1Route.draw());
  }
}
