import { ApplicationController } from ".";

export class HomeController extends ApplicationController {
  async index() {
    this.render("home.view/index", {
      title: this.t("landing.page_title"),
    });
  }
}
