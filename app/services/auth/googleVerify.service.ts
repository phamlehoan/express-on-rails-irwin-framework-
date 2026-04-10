import env from "@configs/env";
import { generateToken } from "@lib";
import models from "@models";
import { OAuth2Client } from "google-auth-library";
import { UnauthorizedError } from "ts-rails";
import { ApplicationService } from "../application.service";

export interface GoogleVerifyResult {
  accessToken: string;
  refreshToken: string;
  user: Awaited<ReturnType<typeof models.user.findUnique>> & {
    fullName: string;
    roles: string[];
  };
}

export class AuthGoogleVerifyService extends ApplicationService {
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

    // Check thêm trường email_verified nếu cần thiết để đảm bảo bảo mật
    if (!payload.email_verified) {
      throw new UnauthorizedError("Email not verified by Google");
    }

    const { email, given_name, family_name, picture, sub } = payload;

    let user = await this.models.user.findUnique({
      where: { email: email! },
      include: { roles: { include: { role: true } } }, // Include roles để trả về thông tin đầy đủ
    });

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
        include: { roles: { include: { role: true } } },
      });
    } else {
      // Cập nhật thông tin mới nhất từ Google (Social Sync)
      user = await this.models.user.update({
        where: { id: user.id },
        data: {
          firstName: given_name || user.firstName,
          lastName: family_name || user.lastName,
          avatarUrl: picture || user.avatarUrl,
          googleId: user.googleId || sub, // Tránh overwrite nếu đã có
        },
        include: { roles: { include: { role: true } } },
      });
    }

    // 1. Tạo JWT Access Token & Refresh Token
    // Thường mình sẽ đưa thêm role/permissions vào AccessToken để Backend không phải query DB nhiều lần
    const userRoles = user.roles.map(
      (r: { role: { code: string } }) => r.role.code,
    );

    const accessToken = generateToken(
      {
        id: user.id,
        roles: userRoles,
      },
      "1h",
    ); // Thời gian ngắn

    const refreshToken = generateToken(
      {
        id: user.id,
      },
      "7d",
    ); // Thời gian dài

    // 2. Lưu RefreshToken vào Database nếu anh muốn quản lý Logout/Revoke
    await this.models.$transaction([
      // Xóa các Refresh Token cũ của user này để dọn dẹp (Optional nhưng nên làm)
      this.models.password.deleteMany({
        where: {
          userId: user.id,
          type: "REFRESH_TOKEN",
        },
      }),
      // Lưu token mới
      this.models.password.create({
        data: {
          userId: user.id,
          password: refreshToken, // Lưu token vào field password
          type: "REFRESH_TOKEN",
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        roles: userRoles,
      },
    };
  }
}
