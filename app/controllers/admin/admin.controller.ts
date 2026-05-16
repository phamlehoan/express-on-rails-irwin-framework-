import { BeforeAction } from "ts-rails";
import { ApplicationController } from "..";

@BeforeAction("requireLogin")
export class AdminController extends ApplicationController {
  async index() {
    this.render("home.view/dashboard", {
      title: this.t("home.page_title"),
    });
  }
}
