import { SendMailOptions, Transporter } from "nodemailer";

/**
 * RailsMailer - Lớp cơ sở cho việc gửi mail trong framework.
 * Tương tự ActionMailer::Base trong Ruby on Rails.
 */
export abstract class RailsMailer {
  /**
   * Phương thức trừu tượng để lấy Transporter và địa chỉ email gửi.
   * Phải được ghi đè ở ApplicationMailer tại tầng ứng dụng.
   */
  protected static async getTransporter(): Promise<{
    transporter: Transporter;
    from: string;
  }> {
    throw new Error("getTransporter() must be implemented in subclass");
  }

  /**
   * Phương thức gửi mail chung.
   */
  static async deliver(options: SendMailOptions): Promise<void> {
    const { transporter, from } = await this.getTransporter();
    await transporter.sendMail({
      from: options.from || from,
      ...options,
    });
  }
}
