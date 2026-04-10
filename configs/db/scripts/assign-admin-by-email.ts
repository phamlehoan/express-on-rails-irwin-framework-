/**
 * Gán role ADMIN cho user theo email.
 * Chạy: npx ts-node -r tsconfig-paths/register db/scripts/assign-admin-by-email.ts <email>
 * VD: npx ts-node -r tsconfig-paths/register db/scripts/assign-admin-by-email.ts your@email.com
 */
import models from "@models";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx ts-node -r tsconfig-paths/register db/scripts/assign-admin-by-email.ts <email>");
  process.exit(1);
}

async function main() {
  const user = await models.user.findFirst({ where: { email, deleted: false } });
  if (!user) {
    console.error(`User "${email}" không tồn tại.`);
    process.exit(1);
  }
  const role = await models.role.findFirst({ where: { code: "ADMIN", deleted: false } });
  if (!role) {
    console.error("Role ADMIN không tồn tại. Chạy yarn db:seed trước.");
    process.exit(1);
  }
  const existing = await models.userToRole.findUnique({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
  });
  if (existing) {
    console.log(`User ${email} đã có role ADMIN.`);
  } else {
    await models.userToRole.create({ data: { userId: user.id, roleId: role.id } });
    console.log(`Đã gán role ADMIN cho ${email}. Đăng nhập lại để vào /admin.`);
  }
}

main()
  .catch(console.error)
  .finally(() => models.$disconnect());
