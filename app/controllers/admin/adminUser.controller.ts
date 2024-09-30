import { Request, Response } from "express";
import { AdminController } from ".";

export class AdminUserController extends AdminController {
  public async index(req: Request, res: Response) {
    res.render("admin/user.view/index", { user: req.user });
  }
}
