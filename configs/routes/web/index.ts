import { Router } from "express";
import { Route } from "..";
import { HomeController } from "../../../app/controllers";
import { RestActions } from "../../enum";

export class WebRoute {
  private static path = Router();

  public static draw() {
    const homeController = new HomeController();
    // this.path.route("/").get(homeController.index);
    Route.resource("/", HomeController, { only: [RestActions.Index] });

    return this.path;
  }
}
