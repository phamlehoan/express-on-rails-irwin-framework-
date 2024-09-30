import { Request, Response } from "express";
import { ApplicationController } from "..";

export class AdminController extends ApplicationController {
  public index(req: Request, res: Response) {
    res.redirect("/admin/users");
  }
}
