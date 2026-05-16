import { PasswordType, UserStatus } from "@models";
import { Prisma } from "@db";
import { Security } from "ts-rails";
import { UnprocessableEntityError } from "ts-rails";
import { ApplicationService } from "../application.service";

export class AuthChangePasswordService extends ApplicationService {
  async execute(
    userId: string,
    oldPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ): Promise<{ ok: true }> {
    if (newPassword !== newPasswordConfirmation) {
      throw new UnprocessableEntityError("Passwords do not match.");
    }

    const user = await this.models.user.findFirst({
      where: { id: userId, deleted: false, status: UserStatus.ACTIVE },
      include: {
        passwords: {
          where: { deleted: false, type: PasswordType.PASSWORD },
          orderBy: { createdAt: Prisma.SortOrder.desc },
          take: 1,
        },
      },
    });

    if (!user?.passwords[0]) {
      throw new UnprocessableEntityError(
        "No password is set for this account. Use the activation link from your email.",
      );
    }

    if (
      !(await Security.verifyPassword(oldPassword, user.passwords[0].password))
    ) {
      throw new UnprocessableEntityError("Current password is incorrect.");
    }

    const hashed = await Security.hashPassword(newPassword);
    const currentId = user.passwords[0].id;

    await this.models.$transaction([
      this.models.password.update({
        where: { id: currentId },
        data: { deleted: true },
      }),
      this.models.password.create({
        data: {
          userId,
          password: hashed,
          type: PasswordType.PASSWORD,
        },
      }),
    ]);

    return { ok: true };
  }
}
