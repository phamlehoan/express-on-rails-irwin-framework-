import { FlashType } from "@configs/enum";
import { Request, Response } from "express";
import { ApplicationController } from ".";

export class DevController extends ApplicationController {
  public async index(req: Request, res: Response) {
    res.render("dev.view/index", { user: req.user });
  }

  public async show(req: Request, res: Response) {
    res.render("dev.view/show", { user: req.user, part: req.params.part || 'colors' });
  }

  public async new(req: Request, res: Response) {
    res.render("dev.view/new", { user: req.user });
  }

  public async create(req: Request, res: Response) {
    req.flash(FlashType.Success, { msg: "Created" });
    res.redirect("/dev");
  }

  public async edit(req: Request, res: Response) {
    res.render("dev.view/edit", { user: req.user });
  }

  public async update(req: Request, res: Response) {
    req.flash(FlashType.Success, { msg: "Updated" });
    res.redirect("/dev");
  }

  public async destroy(req: Request, res: Response) {
    res.redirect("/dev");
  }
}
