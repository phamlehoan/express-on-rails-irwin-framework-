import { Request, Response } from "express";
import { ApplicationController } from ".";

export class DevController extends ApplicationController {
  public async index(req: Request, res: Response) {
    console.log(req.session);
    res.render("home.view/index", { user: req.user, title: "Irwin Framework" });
  }

  public async show(req: Request, res: Response) {
    res.redirect("/");
  }

  public async new(req: Request, res: Response) {
    res.render("dev.view/new", { user: req.user });
  }

  public async create(req: Request, res: Response) {
    res.redirect("/");
  }

  public async edit(req: Request, res: Response) {
    res.render("dev.view/edit", { user: req.user });
  }

  public async update(req: Request, res: Response) {}

  public async destroy(req: Request, res: Response) {}
}
