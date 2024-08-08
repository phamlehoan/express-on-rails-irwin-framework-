import { uploadToFolder } from "@configs/fileUpload";
import { HomeController } from "@controllers";
import { Router } from "express";
import { RestActions } from "../enum";

export class Route {
  private static path = Router();
  private static homeController = new HomeController();

  public static draw() {
    Route.resource(this.path, HomeController, {
      only: [RestActions.Index, RestActions.Show, RestActions.New],
    });
    this.path.post('/', uploadToFolder.single('myFile'), this.homeController.create);

    return this.path;
  }

  public static resource(
    path: Router,
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
      path.route("/").get(action.index);
      
    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.New))
      path.route("/new").get(action.new);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Show))
      path.route("/:id").get(action.show);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Create))
      path.route("/").post(action.create);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Edit))
      path.route("/:id/edit").get(action.edit);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Update))
      path.route("/:id").put(action.update);

    if (this.isAllowAccess(filter?.only, filter?.except, RestActions.Destroy))
      path.route("/:id").delete(action.destroy);
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
