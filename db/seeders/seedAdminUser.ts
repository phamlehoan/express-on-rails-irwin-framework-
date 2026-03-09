/**
 * Tạo user admin@example.com với role ADMIN (nếu chưa có).
 * Sau seed có thể đăng nhập: email admin@example.com, password admin123
 */
import models from "@models";
import md5 from "md5";
import { UserStatus } from "@configs/database";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";

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

  const hasPassword = await models.password.findFirst({
    where: { userId: user.id, deleted: false },
  });
  if (!hasPassword) {
    await models.password.create({
      data: { userId: user.id, password: md5(ADMIN_PASSWORD) },
    });
    console.log(`[seedAdminUser] Set password for ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`);
  }

  console.log("[seedAdminUser] Done");
}
