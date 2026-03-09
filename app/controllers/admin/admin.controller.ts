import { ApplicationController } from "..";

export class AdminController extends ApplicationController {
  async index() {
    this.redirect("/admin/users");
  }
}
