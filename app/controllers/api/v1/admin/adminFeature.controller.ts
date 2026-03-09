import { ApiDoc } from "@lib/apiDoc";
import { NotFoundError } from "@lib/errors";
import models from "@models";
import { ApiV1Controller } from "..";

export class ApiV1AdminFeatureController extends ApiV1Controller {
  @ApiDoc({ summary: "List features (AM)" })
  async index() {
    const features = await models.feature.findMany({
      where: { deleted: false },
      include: {
        permissions: { where: { deleted: false } },
      },
    });
    this.render(features);
  }

  @ApiDoc({ summary: "Show feature (AM)" })
  async show() {
    const feature = await models.feature.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: {
        permissions: { where: { deleted: false } },
      },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    this.render(feature);
  }
}
