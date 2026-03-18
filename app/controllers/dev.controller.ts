import { FlashType } from "@configs/enum";
import { ApplicationController } from ".";

export class DevController extends ApplicationController {
  async index() {
    this.render("dev.view/index");
  }

  async show() {
    this.render("dev.view/show", {
      part: this.req.params.part || this.req.params.id || "colors",
    });
  }

  async new() {
    this.render("dev.view/new");
  }

  async create() {
    this.flash(FlashType.Success, { msg: this.t("flash.created") });
    this.redirect("/dev");
  }

  async edit() {
    this.render("dev.view/edit");
  }

  async update() {
    this.flash(FlashType.Success, { msg: this.t("flash.updated") });
    this.redirect("/dev");
  }

  async destroy() {
    this.redirect("/dev");
  }
}
