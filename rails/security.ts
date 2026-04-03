import { RailsApplication } from "./railsApplication";

/** Interface cho việc băm và kiểm tra mật khẩu (Bcrypt, Argon2, etc.) */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

/**
 * Security utility - tương tự has_secure_password trong Rails
 */
export class Security {
  /**
   * Băm mật khẩu bằng Bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return RailsApplication.hasher!.hash(password);
  }

  /**
   * So khớp mật khẩu
   */
  static async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return RailsApplication.hasher!.verify(password, hash);
  }
}
