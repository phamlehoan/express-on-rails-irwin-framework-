import models from '@models';

export class ApplicationMiddleware {
  public async getUserById(id: string) {
    return await models.user.findUnique({
      where: {
        id,
      },
    });
  }
}
