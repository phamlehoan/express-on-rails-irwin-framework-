import { CourseController } from "@controllers";
import { Router } from "express";
import { Route } from "..";
import { RestActions } from "../../enum";

export class CourseRoute {
  private static path = Router();

  public static draw() {
    Route.resource(this.path, CourseController, { only: [RestActions.Index] });

    return this.path;
  }
}
