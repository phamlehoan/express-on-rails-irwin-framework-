import { User } from "@db";
import models from "@models";

export class ApplicationMiddleware {
  /**
   * Định nghĩa Type cho User kèm Permissions
   */
  public userWithPermissions:
    | (User & { features?: string[]; permissions?: string[] })
    | null = null;

  /**
   * Lấy user kèm permissions (từ Role + UserToPermission trực tiếp).
   * Permissions được merge từ cả hai nguồn để hỗ trợ phân quyền theo từng user.
   */
  public async getUserById(
    id: string,
    isGetPermission = false,
  ): Promise<(User & { features?: string[]; permissions?: string[] }) | null> {
    const user = await models.user.findUnique({
      where: {
        id,
      },
    });

    if (user && isGetPermission) {
      const [permissionFeaturesFromRoles, directUserPermissions] =
        await Promise.all([
          this.getPermissionsFromRoles(id),
          this.getDirectUserPermissions(id),
        ]);

      const features = new Set<string>();
      const permissions = new Set<string>();

      permissionFeaturesFromRoles.forEach(
        ({
          featureCode,
          permissionCode,
        }: {
          featureCode: string;
          permissionCode: string;
        }) => {
          features.add(featureCode);
          permissions.add(`${featureCode}::${permissionCode}`);
        },
      );

      directUserPermissions.forEach(
        ({
          featureCode,
          permissionCode,
        }: {
          featureCode: string;
          permissionCode: string;
        }) => {
          features.add(featureCode);
          permissions.add(`${featureCode}::${permissionCode}`);
        },
      );

      return {
        ...user,
        features: Array.from(features),
        permissions: Array.from(permissions),
      };
    }

    return user;
  }

  /** Permissions từ Role (User -> Role -> Permission) */
  private async getPermissionsFromRoles(
    userId: string,
  ): Promise<{ featureCode: string; permissionCode: string }[]> {
    const permissionFeatures = await models.feature.findMany({
      where: {
        deleted: false,
        permissions: {
          some: {
            deleted: false,
            roles: {
              some: {
                role: {
                  deleted: false,
                  users: {
                    some: {
                      userId,
                    },
                  },
                },
              },
            },
          },
        },
      },
      select: {
        code: true,
        permissions: {
          select: {
            code: true,
          },
        },
      },
    });

    const result: { featureCode: string; permissionCode: string }[] = [];
    permissionFeatures.forEach(
      (feat: { code: string; permissions: { code: string }[] }) => {
        feat.permissions.forEach((p: { code: string }) => {
          result.push({ featureCode: feat.code, permissionCode: p.code });
        });
      },
    );
    return result;
  }

  /** Permissions trực tiếp gán cho user (UserToPermission) */
  private async getDirectUserPermissions(
    userId: string,
  ): Promise<{ featureCode: string; permissionCode: string }[]> {
    const userPermissions = await models.userToPermission.findMany({
      where: {
        userId,
        permission: {
          deleted: false,
          feature: {
            deleted: false as boolean,
          },
        },
      },
      select: {
        permission: {
          select: {
            code: true,
            feature: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    return userPermissions.map(
      (up: {
        permission: {
          code: string;
          feature: { code: string };
        };
      }) => ({
        featureCode: up.permission.feature.code,
        permissionCode: up.permission.code,
      }),
    );
  }
}
