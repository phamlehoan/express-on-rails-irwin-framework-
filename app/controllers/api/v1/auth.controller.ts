import env from "@configs/env";
import { generateToken } from "@configs/jwt";
import models from "@models";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { ApiV1Controller } from ".";

export class AuthController extends ApiV1Controller {
  private googleClient = new OAuth2Client(env.googleClientId);

  public async googleVerify(req: Request, res: Response) {
    const { idToken } = req.body;

    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing ID token" });
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: env.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid ID token" });
      }

      const { email, given_name, family_name, picture, sub } = payload;

      let user = await models.user.findUnique({ where: { email } });
      if (!user) {
        user = await models.user.create({
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
        user = await models.user.update({
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

      res.status(200).json({
        success: true,
        data: { token, user },
      });
    } catch (error) {
      console.error("Google verification failed:", error);
      res
        .status(500)
        .json({ success: false, message: "Google authentication failed" });
    }
  }
}
