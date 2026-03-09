import { AuthGoogleVerifyService } from "@services/auth/googleVerify.service";
import { GoogleVerifyValidator } from "@validators/auth.validator";
import { ApiV1Controller } from ".";

export class AuthController extends ApiV1Controller {
  async googleVerify() {
    const { idToken } = await this.params(GoogleVerifyValidator).permit(
      "idToken",
    );
    const result = await new AuthGoogleVerifyService().execute(idToken);
    this.render(result);
  }
}
