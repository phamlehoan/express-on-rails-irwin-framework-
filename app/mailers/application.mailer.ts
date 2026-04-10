import { appPath } from "@lib/utils/path";
import i18next from "i18next";
import pug from "pug";
import { RailsMailer } from "ts-rails";

/**
 * ApplicationMailer - Lớp cha cho tất cả các Mailer trong ứng dụng.
 * Nó kế thừa RailsMailer từ rails và không cần biết về chi tiết dịch vụ gửi mail.
 * Việc cấu hình dịch vụ gửi mail được thực hiện ở configs/application.ts thông qua MailerAdapter.
 */
export class ApplicationMailer extends RailsMailer {
  /**
   * Phương thức này chỉ cần tồn tại để thỏa mãn lớp cha, nhưng sẽ không bao giờ
   * được gọi nếu RailsApplication.mailerAdapter đã được cấu hình trong application.ts.
   */
  protected static async getTransporter(): Promise<{
    transporter: any;
    from: string;
  }> {
    throw new Error(
      "ApplicationMailer.getTransporter() should not be called if MailerAdapter is configured.",
    );
  }

  /**
   * Render một view thành chuỗi HTML để gửi email.
   * @param view Path của view (vd: 'user.mailer/created_user')
   * @param locals Các biến truyền vào template
   */
  protected static render(view: string, locals: any): string {
    const templatePath = appPath("views", `${view}.pug`);
    return pug.renderFile(templatePath, {
      t: i18next.t.bind(i18next),
      ...locals,
    });
  }
}
