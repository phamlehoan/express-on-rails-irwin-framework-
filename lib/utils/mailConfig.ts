import env from "@configs/env";
import { RailsApplication } from "ts-rails";

/**
 * Mail có thể gửi khi đã cài mailer (adapter) + EMAIL_FROM + thông tin dịch vụ đủ.
 * `MAIL_SERVICE=test` vẫn tính là configured (log ra console).
 */
export function isMailDeliveryConfigured(): boolean {
  if (!RailsApplication.mailerAdapter) return false;

  const from = (env.emailFrom || "").trim();
  if (!from) return false;

  const service = (env.mailService || "").trim().toLowerCase();

  if (service === "test") return true;

  if (service === "smtp") {
    return Boolean(
      (env.mailHost || "").trim() &&
        (env.mailUser || "").trim() &&
        (env.mailPass || "").trim(),
    );
  }

  if (service === "gmail") {
    return Boolean((env.googleRefreshToken || "").trim());
  }

  return false;
}
