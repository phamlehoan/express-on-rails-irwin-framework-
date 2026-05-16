import env from "@configs/env";
import { generateToken, verifyToken } from "@lib";
import { PasswordType, UserStatus } from "@models";
import {
  Security,
  UnauthorizedError,
  UnprocessableEntityError,
} from "ts-rails";
import { ApplicationService } from "../application.service";

export const PASSWORD_RESET_PURPOSE = "password_reset";

export function buildResetPasswordUrl(token: string): string {
  const base = env.clientAppUrl.replace(/\/$/, "");
  const enc = encodeURIComponent(token);
  if (env.clientAppHashRouter) {
    return `${base}/#/reset-password?token=${enc}`;
  }
  return `${base}/reset-password?token=${enc}`;
}

export function generatePasswordResetToken(userId: string): string {
  return generateToken(
    { id: userId, purpose: PASSWORD_RESET_PURPOSE },
    "7d",
  );
}

export class AuthPasswordResetService extends ApplicationService {
  private verifyResetJwt(token: string): string {
    let decoded: ReturnType<typeof verifyToken>;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired password reset link.");
    }
    if (
      (decoded as { purpose?: string }).purpose !== PASSWORD_RESET_PURPOSE ||
      !decoded.id
    ) {
      throw new UnauthorizedError("Invalid or expired password reset link.");
    }
    return decoded.id;
  }

  async getResetPreview(token: string) {
    const userId = this.verifyResetJwt(token);
    const user = await this.models.user.findFirst({
      where: { id: userId, deleted: false },
    });
    if (!user) {
      throw new UnauthorizedError("This password reset link is no longer valid.");
    }
    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async acceptReset(
    token: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<{ ok: true }> {
    if (password !== passwordConfirmation) {
      throw new UnprocessableEntityError("Passwords do not match.");
    }
    const userId = this.verifyResetJwt(token);
    const user = await this.models.user.findFirst({
      where: { id: userId, deleted: false },
    });
    if (!user) {
      throw new UnauthorizedError("This password reset link is no longer valid.");
    }

    const hashed = await Security.hashPassword(password);
    const nextStatus =
      user.status === UserStatus.PENDING ? UserStatus.ACTIVE : user.status;

    await this.models.$transaction([
      this.models.password.updateMany({
        where: {
          userId,
          type: PasswordType.PASSWORD,
          deleted: false,
        },
        data: { deleted: true },
      }),
      this.models.password.deleteMany({
        where: { userId, type: PasswordType.REFRESH_TOKEN },
      }),
      this.models.password.create({
        data: {
          userId,
          password: hashed,
          type: PasswordType.PASSWORD,
        },
      }),
      this.models.user.update({
        where: { id: userId },
        data: { status: nextStatus },
      }),
    ]);

    return { ok: true };
  }
}
