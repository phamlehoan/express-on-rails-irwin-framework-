import env from "@configs/env";
import { RailsApplication } from "ts-rails";
import {
  GmailOAuth2MailerAdapter,
  SmtpMailerAdapter,
  TestMailerAdapter,
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
      RailsApplication.mailerAdapter = new TestMailerAdapter();
      break;
    default:
      RailsApplication.loggerAdapter?.warn(
        `[Mailer] Unknown mail service: ${env.mailService}. Mailer will not send emails.`,
      );
  }
}
