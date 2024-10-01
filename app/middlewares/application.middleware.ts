import models from '@models';
import { User } from '@prisma/client';

export class ApplicationMiddleware {
  public async getUserById(
    id: string,
    isGetPermission = false
  ): Promise<User & {
    features?: string[],
    permissions?: string[]
  } | null> {
    const user = await models.user.findUnique({
      where: {
        id,
      },
    });

    if (user && isGetPermission) {
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
                        userId: id
                      }
                    }
                  }
                }
              }
            }
          }
        },
        select: {
          code: true,
          permissions: {
            select: {
              code: true,
            }
          }
        }
      });

      let features: string[] = [];
      let permissions: string[] = [];

      permissionFeatures.forEach(feature => {
        features.push(feature.code);
        permissions = [
          ...permissions,
          ...feature.permissions.map(
            permission => `${feature.code}::${permission.code}`
          )
        ]
      });

      return {
        ...user,
        features,
        permissions,
      }
    }

    return user;
  }
}
