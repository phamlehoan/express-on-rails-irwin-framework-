import { Request, Response } from "express";
import { ApplicationController } from ".";

export class HomeController extends ApplicationController {
  public async index(req: Request, res: Response) {
    const currentPage = req.body.currentPage
      ? +req.body.currentPage
      : req.query.currentPage
      ? +req.query.currentPage
      : 1;
    const pageSize = req.body.pageSize
      ? +req.body.pageSize
      : req.query.pageSize
      ? +req.query.pageSize
      : 10;

    res.render("home.view/index", {
      currentPage: currentPage,
      pageSize: pageSize,
    });
  }
}
