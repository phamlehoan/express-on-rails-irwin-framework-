import userData from "@models/faker/user.json";
import { Request, Response } from "express";
import { ApplicationController } from "../application.controller";

export class HomeController extends ApplicationController {
  public index(req: Request, res: Response) {
    const users = userData;
    res.render("home.view/index", { title: "Irwin Framework", users: users });
  }

  public show(req: Request, res: Response) {}

  public create(req: Request, res: Response) {}
}
