/**
 * Tạo user admin@example.com với role ADMIN (nếu chưa có).
 * Sau seed: email admin@example.com, password Abcd@1234
 * Role ADMIN và permissions được gán trong seedFeatures().
 */
import models, { PasswordType, UserStatus } from "@models";
import bcrypt from "bcrypt";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Abcd@1234";

export async function seedAdminUser() {
  const role = await models.role.findFirst({
    where: { code: "ADMIN", deleted: false },
  });
  if (!role) {
    console.warn("[seedAdminUser] Role ADMIN chưa tồn tại, bỏ qua.");
    return;
  }

  let user = await models.user.findFirst({
    where: { email: ADMIN_EMAIL, deleted: false },
  });

  if (!user) {
    user = await models.user.create({
      data: {
        firstName: "Admin",
        lastName: "User",
        email: ADMIN_EMAIL,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`[seedAdminUser] Created user: ${ADMIN_EMAIL}`);
  } else if (user.status !== UserStatus.ACTIVE) {
    await models.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE },
    });
    console.log(`[seedAdminUser] Updated user ${ADMIN_EMAIL} to ACTIVE`);
  }

  const hasRole = await models.userToRole.findUnique({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
  });
  if (!hasRole) {
    await models.userToRole.create({
      data: { userId: user.id, roleId: role.id },
    });
    console.log(`[seedAdminUser] Assigned ADMIN role to ${ADMIN_EMAIL}`);
  }

  const pwdHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existingPw = await models.password.findFirst({
    where: {
      userId: user.id,
      deleted: false,
      type: PasswordType.PASSWORD,
    },
  });
  if (!existingPw) {
    await models.password.create({
      data: {
        userId: user.id,
        password: pwdHash,
        type: PasswordType.PASSWORD,
      },
    });
    console.log(`[seedAdminUser] Set password for ${ADMIN_EMAIL}`);
  } else {
    await models.password.update({
      where: { id: existingPw.id },
      data: { password: pwdHash },
    });
    console.log(`[seedAdminUser] Refreshed password for ${ADMIN_EMAIL}`);
  }

  console.log("[seedAdminUser] Done");
}
