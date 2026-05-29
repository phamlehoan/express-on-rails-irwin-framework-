import { FlashType } from "@configs/enum";
import { isMailDeliveryConfigured } from "@lib/utils/mailConfig";
import { AuthRegisterService } from "@services";
import { RegisterUserValidator } from "@validators/auth.validator";
import { UnprocessableEntityError } from "ts-rails";
import { ApplicationController } from ".";

export class UserController extends ApplicationController {
  async index() {
    this.render("user.view/index", { user: this.currentUser });
  }

  async new() {
    this.render("user.view/new", {
      title: this.t("users.register_title"),
      mailActivationRequired: isMailDeliveryConfigured(),
    });
  }

  async create() {
    const mailActivationRequired = isMailDeliveryConfigured();
    const fields = mailActivationRequired
      ? (["firstName", "lastName", "middleName", "email"] as const)
      : ([
          "firstName",
          "lastName",
          "middleName",
          "email",
          "password",
          "passwordConfirmation",
        ] as const);

    const data = await this.params(RegisterUserValidator).permit(...fields);

    try {
      const result = await new AuthRegisterService().execute({
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email,
        password: (data as { password?: string }).password,
        passwordConfirmation: (data as { passwordConfirmation?: string })
          .passwordConfirmation,
      });

      if (result.activationRequired) {
        this.flash(
          result.emailSent ? FlashType.Success : FlashType.Errors,
          {
            msg: result.emailSent
              ? this.t("flash.registration_invite_sent", {
                  email: result.user.email,
                })
              : this.t("flash.registration_invite_failed", {
                  email: result.user.email,
                }),
          },
        );
      } else {
        this.flash(FlashType.Success, {
          msg: this.t("flash.registration_success", {
            email: result.user.email,
          }),
        });
      }
    } catch (e) {
      if (e instanceof UnprocessableEntityError) {
        const code = e.message;
        if (code === "REGISTRATION_EMAIL_EXISTS") {
          throw new UnprocessableEntityError(
            this.t("flash.registration_email_exists"),
          );
        }
        if (code === "PASSWORD_MISMATCH") {
          this.flash(FlashType.Errors, { msg: this.t("flash.password_mismatch") });
          return this.redirect("/users/new");
        }
      }
      throw e;
    }

    this.redirect("/auth");
  }
}
