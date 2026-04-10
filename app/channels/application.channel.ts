import { User } from "@db";
import { Request } from "express";
import { RailsChannel } from "ts-rails";
import { ApplicationMiddleware } from "../middlewares";

/**
 * ApplicationChannel - Tương tự ApplicationCable::Channel trong Rails.
 * Đây là class cha cho tất cả các channel trong ứng dụng.
 * Bạn có thể thêm logic xác thực hoặc helper chung ở đây.
 */
export abstract class ApplicationChannel extends RailsChannel {
  /**
   * Lấy user hiện tại từ DB dựa vào session userId.
   */
  protected async getCurrentUser(): Promise<
    (User & { permissions?: string[] }) | null
  > {
    const req = this.socket.request as Request & {
      session?: { userId?: string };
    };
    const userId = req.session?.userId;

    if (userId) {
      const appMiddleware = new ApplicationMiddleware();
      return await appMiddleware.getUserById(userId, true);
    }
    return null;
  }

  /**
   * Đảm bảo user đã đăng nhập, nếu không thì reject subscription.
   * Gọi hàm này trong `subscribe()` của các channel cần xác thực.
   */
  protected async ensureAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) {
      this.socket.disconnect();
      return false;
    }
    return true;
  }
}
