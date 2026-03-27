import { RailsRoute } from "@lib";
import { ApiV1Route } from "./v1";

export class ApiRoute extends RailsRoute {
  public draw() {
    this.path("/v1", ApiV1Route.draw());
  }
}
