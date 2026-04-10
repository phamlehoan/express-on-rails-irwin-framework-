/**
 * Kiểm tra user admin@example.com: roles và permissions.
 * Chạy: npx ts-node -r tsconfig-paths/register db/scripts/check-admin-user.ts
 */
import { ApplicationMiddleware } from "@middlewares";
import models from "@models";

const EMAIL = "admin@example.com";

async function main() {
  const user = await models.user.findFirst({
    where: { email: EMAIL, deleted: false },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: { include: { feature: true } },
                },
              },
            },
          },
        },
      },
      permissions: {
        include: {
          permission: { include: { feature: true } },
        },
      },
    },
  });

  if (!user) {
    console.log(`User "${EMAIL}" không tồn tại trong database.`);
    return;
  }

  console.log("User:", user.id, user.email, user.firstName, user.lastName);
  console.log("\n--- Roles ---");
  if (!user.roles?.length) {
    console.log("  (không có role nào)");
  } else {
    for (const ur of user.roles) {
      const r = ur.role;
      console.log("  -", r.code, r.name);
      const perms =
        r.permissions?.map(
          (rp: {
            permission: {
              code: string;
              feature: { code: string };
            };
          }) => rp.permission,
        ) ?? [];
      for (const p of perms) {
        console.log("      ", p.feature.code + "::" + p.code);
      }
    }
  }

  console.log("\n--- Direct permissions (UserToPermission) ---");
  if (!user.permissions?.length) {
    console.log("  (không có)");
  } else {
    for (const up of user.permissions) {
      const p = up.permission;
      console.log("  -", p.feature.code + "::" + p.code);
    }
  }

  const appMiddleware = new ApplicationMiddleware();
  const withPerms = await appMiddleware.getUserById(user.id, true);
  const perms = withPerms?.permissions ?? [];
  console.log("\n--- Permissions merged (AM/UM để vào admin) ---");
  console.log(
    "  ",
    perms.length ? perms.join(", ") : "(rỗng – không đủ quyền vào admin)",
  );
  const hasAdmin = perms.some(
    (p: string) => p.startsWith("AM::") || p.startsWith("UM::"),
  );
  console.log("\n  Có quyền vào admin?", hasAdmin ? "CÓ" : "KHÔNG");
}

main()
  .catch(console.error)
  .finally(() => models.$disconnect());
