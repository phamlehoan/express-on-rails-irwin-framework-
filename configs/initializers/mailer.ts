import env from "@configs/env";
import { RailsApplication } from "ts-rails";
import {
  DevMailerAdapter,
  GmailOAuth2MailerAdapter,
  SmtpMailerAdapter,
} from "../mail";

export function initializeMailer() {
  switch (env.mailService) {
    case "gmail":
      RailsApplication.mailerAdapter = new GmailOAuth2MailerAdapter();
      break;
    case "smtp":
      RailsApplication.mailerAdapter = new SmtpMailerAdapter();
      break;
    case "test":
      RailsApplication.mailerAdapter = new DevMailerAdapter();
      break;
    default:
      RailsApplication.loggerAdapter?.warn(
        `[Mailer] Unknown mail service: ${env.mailService}. Mailer will not send emails.`,
      );
  }
}
