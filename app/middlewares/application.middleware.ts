import { User } from "@db";
import { getMergedPermissionStrings } from "@lib/utils/userPermissions";
import models from "@models";

export class ApplicationMiddleware {
  /**
   * Định nghĩa Type cho User kèm Permissions
   */
  public userWithPermissions:
    | (User & { features?: string[]; permissions?: string[] })
    | null = null;

  /**
   * Lấy user kèm permissions — merge giống `getMergedPermissionStrings` (Role + UserToPermission).
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
      const permissionStrings = await getMergedPermissionStrings(user.id);
      const features = new Set<string>();
      for (const s of permissionStrings) {
        const [fc] = s.split("::", 2);
        if (fc) features.add(fc);
      }
      return {
        ...user,
        features: Array.from(features),
        permissions: permissionStrings,
      };
    }

    return user;
  }
}
