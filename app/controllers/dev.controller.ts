import { FlashType } from "@configs/enum";
import { ApplicationController } from ".";

export class DevController extends ApplicationController {
  async index() {
    this.renderView("dev.view/index", { user: this.req.user });
  }

  async show() {
    this.renderView("dev.view/show", {
      user: this.req.user,
      part: this.req.params.part || this.req.params.id || "colors",
    });
  }

  async new() {
    this.renderView("dev.view/new", { user: this.req.user });
  }

  async create() {
    this.flash(FlashType.Success, { msg: this.t("flash.created") });
    this.redirect("/dev");
  }

  async edit() {
    this.renderView("dev.view/edit", { user: this.req.user });
  }

  async update() {
    this.flash(FlashType.Success, { msg: this.t("flash.updated") });
    this.redirect("/dev");
  }

  async destroy() {
    this.redirect("/dev");
  }
}
