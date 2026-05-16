import { getMergedPermissionStrings } from "@lib/utils/userPermissions";
import { ApiV1Controller } from "./apiV1.controller";

export class MyPermissionController extends ApiV1Controller {
  async index() {
    const codes = await getMergedPermissionStrings(this.req.user!.id);
    this.renderJson(codes);
  }
}
