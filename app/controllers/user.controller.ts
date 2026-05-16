import { FlashType } from "@configs/enum";
import { UserMailer } from "@mailers/user.mailer";
import models from "@models";
import {
  buildActivateAccountUrl,
  generateInviteToken,
} from "@services";
import { RegisterUserValidator } from "@validators/auth.validator";
import { logger, UnprocessableEntityError } from "ts-rails";
import { ApplicationController } from ".";

export class UserController extends ApplicationController {
  async index() {
    this.render("user.view/index", { user: this.currentUser });
  }

  async new() {
    this.render("user.view/new", {
      title: this.t("users.register_title"),
    });
  }

  async create() {
    const data = await this.params(RegisterUserValidator).permit(
      "firstName",
      "lastName",
      "middleName",
      "email",
    );

    const email = data.email.trim().toLowerCase();
    const existing = await models.user.findFirst({
      where: { email, deleted: false },
    });
    if (existing) {
      throw new UnprocessableEntityError(
        this.t("flash.registration_email_exists"),
      );
    }

    const user = await models.user.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        middleName: data.middleName?.trim() || null,
        email,
        status: "PENDING",
      },
    });

    let inviteSent = false;
    try {
      const inviteToken = generateInviteToken(user.id);
      const activateLink = buildActivateAccountUrl(inviteToken);
      await UserMailer.accountInvite(
        user.email,
        user.firstName,
        user.lastName,
        activateLink,
      );
      inviteSent = true;
    } catch (err) {
      logger.error(
        { err: String(err), userId: user.id, email: user.email },
        "[UserController.create] Failed to send invite email",
      );
    }

    this.flash(
      inviteSent ? FlashType.Success : FlashType.Errors,
      {
        msg: inviteSent
          ? this.t("flash.registration_invite_sent", { email: user.email })
          : this.t("flash.registration_invite_failed", { email: user.email }),
      },
    );
    this.redirect("/auth");
  }
}
