import { FlashType } from "@configs/enum";
import models from "@models";
import { UpdateProfileValidator } from "@validators/profile.validator";
import { ApplicationController } from ".";

export class ProfileController extends ApplicationController {
  async show() {
    const user = this.req.user;
    if (!user) return this.redirect("/auth");

    const currentUser = await models.user.findFirst({
      where: { id: user.id, deleted: false },
    });
    if (!currentUser) return this.redirect("/auth");

    this.renderView("profile.view/show", {
      user: currentUser,
    });
  }

  async update() {
    const userId = this.req.user?.id;
    if (!userId) return this.redirect("/auth");

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
