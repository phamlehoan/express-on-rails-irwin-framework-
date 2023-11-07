import { HomeController } from "@controllers";
import { Router } from "express";
import { RestActions } from "../enum";

export class Route {
  private static path = Router();

  public static draw() {
    Route.resource("/", HomeController, { only: [RestActions.Index] });

    return this.path;
  }

  public static resource(
    uri: string,
    CustomController: any,
    filter?: {
      only?: RestActions[];
      except?: RestActions[];
    }
  ) {
    if (filter?.only && filter?.except) {
      throw new Error("Can only pass only or except!");
    }

    const action = new CustomController();

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Index))
      this.path.route(uri).get(action.index);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Show))
      this.path.route(`${uri}/:id`).get(action.show);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.New))
      this.path.route(`${uri}/new`).get(action.new);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Create))
      this.path.route(uri).post(action.create);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Edit))
      this.path.route(`${uri}/:id/edit`).get(action.edit);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Update))
      this.path.route(`${uri}/:id`).put(action.update);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Destroy))
      this.path.route(`${uri}/:id`).delete(action.destroy);
  }

  private static isAllowAccess(
    only: RestActions[] | undefined,
    except: RestActions[] | undefined,
    action: RestActions
  ) {
    return (
      (!only && !except) ||
      (only && only?.includes(action)) ||
      (except && !except?.includes(action))
    );
  }
}
