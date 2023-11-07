import { Request, Response } from "express";
import { ApplicationController } from "../../application.controller";

export class HomeController extends ApplicationController {
  public index(req: Request, res: Response) {
    res.send("Express + TypeScript Server");
  }
}
