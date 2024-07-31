import { models } from "@models";
import { Request, Response } from "express";
import { ApplicationController } from "../application.controller";

export class HomeController extends ApplicationController {
  public index(req: Request, res: Response) {
    const a = models();
    res.render("home.view/index", { title: "Irwin Framework" });
  }

  public show(req: Request, res: Response) {}

  public create(req: Request, res: Response) {}
}
