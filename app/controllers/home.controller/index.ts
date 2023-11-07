import { Request, Response } from "express";
import { ApplicationController } from "../application.controller";

export class HomeController extends ApplicationController {
  public index(req: Request, res: Response) {
    res.render("home.view/index", { title: "Irwin Framework" });
  }
}
