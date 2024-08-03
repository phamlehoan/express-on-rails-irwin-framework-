import models from "@models";
import { Request, Response } from "express";
import { ApplicationController } from "../application.controller";

export class HomeController extends ApplicationController {
  public async index(req: Request, res: Response) {
    // const user2 = await models.user.create({
    //   email:"a@gmail.com",
    //   firstName:'Dang',
    //   lastName:"Hoa"
    // });
    const user = await models.user.findAll();
    console.log(user.map((_: any) => _.dataValues ));
    res.render("home.view/index", { title: "Helo" });
  }
}
