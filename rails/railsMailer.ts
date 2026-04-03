import { SendMailOptions, Transporter } from "nodemailer";
import { RailsApplication } from "./railsApplication";

/**
 * Interface cho Mailer Adapter.
 * Ứng dụng sẽ triển khai interface này để tích hợp các dịch vụ gửi mail khác nhau.
 */
export interface MailerAdapter {
  sendMail(options: SendMailOptions): Promise<void>;
  getDefaultFromAddress(): string;
}

/**
 * RailsMailer - Lớp cơ sở cho việc gửi mail trong framework.
 * Tương tự ActionMailer::Base trong Ruby on Rails.
 */
export abstract class RailsMailer {
  /**
   * Phương thức trừu tượng. ApplicationMailer sẽ ghi đè để cung cấp Transporter
   * hoặc các thông tin cần thiết cho Adapter.
   */
  protected static async getTransporter(): Promise<{
    transporter: Transporter;
    from: string;
  }> {
    throw new Error(
      "ApplicationMailer must implement getTransporter() if not using a MailerAdapter.",
    );
  }

  /**
   * Phương thức gửi mail chung.
   */
  static async deliver(options: SendMailOptions): Promise<void> {
    if (!RailsApplication.mailerAdapter) {
      // Fallback về cách cũ nếu không có adapter nào được cấu hình
      const { transporter, from } = await this.getTransporter();
      await transporter.sendMail({ from: options.from || from, ...options });
      return;
    }

    await RailsApplication.mailerAdapter.sendMail({
      from:
        options.from || RailsApplication.mailerAdapter.getDefaultFromAddress(),
      ...options,
    });
  }
}
