import env from "@configs/env";
import { generateToken } from "@lib";
import models from "@models";
import { OAuth2Client } from "google-auth-library";
import { UnauthorizedError } from "ts-rails";
import { BaseService } from "../base.service";

export interface GoogleVerifyResult {
  token: string;
  user: Awaited<ReturnType<typeof models.user.findUnique>>;
}

export class AuthGoogleVerifyService extends BaseService {
  private googleClient = new OAuth2Client(env.googleClientId);

  async execute(idToken: string): Promise<GoogleVerifyResult> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedError("Invalid ID token");
    }

    const { email, given_name, family_name, picture, sub } = payload;

    let user = await this.models.user.findUnique({ where: { email: email! } });
    if (!user) {
      user = await this.models.user.create({
        data: {
          email: email!,
          firstName: given_name || "",
          lastName: family_name || "",
          avatarUrl: picture || "",
          status: "ACTIVE",
          googleId: sub,
          roles: {
            create: [{ role: { connect: { code: "WORKER" } } }],
          },
        },
      });
    } else {
      user = await this.models.user.update({
        where: { id: user.id },
        data: {
          firstName: given_name,
          lastName: family_name,
          email: email,
          avatarUrl: picture,
          googleId: user.googleId ? user.googleId : sub,
        },
      });
    }

    const token = generateToken({ id: user.id });
    return { token, user };
  }
}
