import models from "@models";

const PERMISSION_CODES = ["READ", "CREATE", "UPDATE", "DELETE"] as const;

export interface FeatureDefinition {
  code: string;
  name: string;
  description?: string;
  type?: string;
  parentCode?: string | null;
  sortOrder?: number;
}

/**
 * Đăng ký Feature + Permissions (READ, CREATE, UPDATE, DELETE).
 * Dùng Prisma Client → hoạt động với mọi provider (SQLite, MySQL, PostgreSQL).
 *
 * Khi thêm tính năng mới: thêm vào db/seeders/features.ts và chạy yarn db:seed
 */
export async function registerFeature(def: FeatureDefinition) {
  let feature = await models.feature.findFirst({
    where: { code: def.code, deleted: false },
  });

  if (!feature) {
    feature = await models.feature.create({
      data: {
        code: def.code,
        name: def.name,
        description: def.description || null,
        type: def.type || "FEATURE",
      },
    });
    console.log(`[registerFeature] Created feature: ${def.code}`);
  } else if (def.type && def.type !== feature.type) {
    const typeOnly = def.type;
    await models.feature.update({
      where: { id: feature.id },
      data: { type: typeOnly },
    });
    feature = await models.feature.findFirstOrThrow({ where: { id: feature.id } });
  }

  // Tạo permissions (READ, CREATE, UPDATE, DELETE) cho mọi feature kể cả MENU_GROUP
  // để role có thể được gán quyền (vd: AM cho Role & Permissions)
  for (const code of PERMISSION_CODES) {
    const existing = await models.permission.findFirst({
      where: {
        code,
        featureId: feature.id,
        deleted: false,
      },
    });

    if (!existing) {
      await models.permission.create({
        data: {
          code,
          name: code.charAt(0) + code.slice(1).toLowerCase(),
          description: `${code} data`,
          featureId: feature.id,
          type: def.type || "FEATURE",
        },
      });
      console.log(`[registerFeature] Created permission: ${def.code}::${code}`);
    }
  }

  return feature;
}

export async function setFeatureParents(
  features: Array<{ code: string; parentCode?: string | null }>
) {
  for (const def of features) {
    const parentCode = def.parentCode;
    if (!parentCode) continue;
    const parent = await models.feature.findFirst({
      where: { code: parentCode, deleted: false },
    });
    if (!parent) continue;
    const feature = await models.feature.findFirst({
      where: { code: def.code, deleted: false },
    });
    if (feature && !feature.parentId) {
      await models.feature.update({
        where: { id: feature.id },
        data: { parentId: parent.id },
      });
      console.log(`[setFeatureParents] ${def.code} -> parent ${parentCode}`);
    }
  }
}

/**
 * Gán permission cho role
 */
export async function assignPermissionToRole(
  roleCode: string,
  featureCode: string,
  permissionCodes?: string[]
) {
  const role = await models.role.findFirst({
    where: { code: roleCode, deleted: false },
  });
  if (!role) throw new Error(`Role ${roleCode} not found`);

  const permissions = await models.permission.findMany({
    where: {
      feature: { code: featureCode, deleted: false },
      code: permissionCodes ? { in: permissionCodes } : undefined,
      deleted: false,
    },
  });

  for (const p of permissions) {
    await models.roleToPermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: p.id },
      },
      create: { roleId: role.id, permissionId: p.id },
      update: {},
    });
  }
  console.log(`[assignPermissionToRole] ${roleCode} <- ${featureCode}`);
}

/**
 * Tạo role nếu chưa tồn tại (dùng trong seed trước khi assignPermissionToRole).
 */
export async function ensureRole(
  roleCode: string,
  name: string,
  description?: string | null
) {
  let role = await models.role.findFirst({
    where: { code: roleCode, deleted: false },
  });
  if (!role) {
    role = await models.role.create({
      data: {
        code: roleCode,
        name,
        description: description ?? null,
        isReadOnly: true,
      },
    });
    console.log(`[ensureRole] Created role: ${roleCode}`);
  }
  return role;
}
