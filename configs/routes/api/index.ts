import { ApiResponse, RailsRoute } from "ts-rails";
import { ApiV1Route } from "./v1";

export class ApiRoute extends RailsRoute {
  public draw() {
    this.get(
      "/health",
      async (_req, res) => {
        const { checkReadiness } = await import("@configs/plugins");
        const status = await checkReadiness();
        const code = status.status === "ok" ? 200 : 503;
        res.status(code).json(ApiResponse.ok(status));
      },
      {
        document: { tags: ["System"] },
      },
    );

    this.path("/v1", ApiV1Route.draw());
  }
}
