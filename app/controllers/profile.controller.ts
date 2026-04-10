import { FlashType } from "@configs/enum";
import models from "@models";
import { UpdateProfileValidator } from "@validators/profile.validator";
import { BeforeAction } from "ts-rails";
import { ApplicationController } from ".";

@BeforeAction("requireLogin")
export class ProfileController extends ApplicationController {
  async show() {
    const currentUser = await models.user.findFirst({
      where: { id: this.currentUser!.id, deleted: false },
    });
    // The check for currentUser is a bit redundant since requireLogin does it,
    // but it's good for type safety and in case the user is deleted between requests.
    if (!currentUser) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.redirect("/auth");
    }

    this.render("profile.view/show", {
      user: currentUser,
    });
  }

  async update() {
    const userId = this.currentUser!.id;

    const data = await this.params(UpdateProfileValidator).permit(
      "firstName",
      "lastName",
      "phoneNumber",
      "address",
      "gender",
    );

    const { firstName, lastName, phoneNumber, address, gender } = data;

    await models.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(gender !== undefined && { gender }),
      },
    });

    this.flash(FlashType.Success, { msg: this.t("flash.profile_updated") });
    this.redirect("/me");
  }
}
