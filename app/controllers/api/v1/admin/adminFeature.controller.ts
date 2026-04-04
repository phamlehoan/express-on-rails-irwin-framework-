import models from "@models";
import { NotFoundError } from "ts-rails";
import { ApiV1Controller } from "..";

export class ApiV1AdminFeatureController extends ApiV1Controller {
  async index() {
    const features = await models.feature.findMany({
      where: { deleted: false },
      include: {
        permissions: { where: { deleted: false } },
      },
    });
    this.renderJson(features);
  }

  async show() {
    const feature = await models.feature.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: {
        permissions: { where: { deleted: false } },
      },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    this.renderJson(feature);
  }
}
