import { Request, Response } from "express";
import { ApplicationController } from ".";

export class HomeController extends ApplicationController {
  public async index(req: Request, res: Response) {
    res.render("home.view/index");
  }
}
