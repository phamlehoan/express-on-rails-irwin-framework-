import { PasswordType } from "@configs/db/enums";
import { generateToken, verifyToken } from "@lib";
import { UnauthorizedError } from "ts-rails";
import { ApplicationService } from "../application.service";

export class AuthRefreshTokenService extends ApplicationService {
  async execute(refreshToken: string) {
    // 1. Verify chữ ký và thời hạn của JWT
    // Nếu token hết hạn hoặc sai format, hàm verifyToken sẽ throw lỗi (thường là 401)
    const decoded = verifyToken(refreshToken);
    const userId = decoded.id;
    if (!userId) {
      throw new UnauthorizedError("Refresh token is not valid.");
    }

    // 2. Tìm token trong database
    // Phải khớp: chuỗi token, type REFRESH_TOKEN và chưa bị xóa (deleted: false)
    const storedToken = await this.models.password.findFirst({
      where: {
        userId,
        password: refreshToken,
        type: PasswordType.REFRESH_TOKEN,
        deleted: false,
      },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!storedToken || !storedToken.user) {
      throw new UnauthorizedError(
        "Refresh token is not valid or has been revoked.",
      );
    }

    const user = storedToken.user;
    const userRoles = user.roles.map(
      (r: { role: { code: string } }) => r.role.code,
    );

    // 3. Tạo cặp Token mới
    const newAccessToken = generateToken(
      { id: user.id, roles: userRoles },
      "1h",
    );
    const newRefreshToken = generateToken({ id: user.id }, "7d");

    // 4. Cập nhật Database (Rotation Strategy)
    // Xóa token cũ và lưu token mới trong một Transaction
    await this.models.$transaction([
      this.models.password.delete({
        where: { id: storedToken.id },
      }),
      this.models.password.create({
        data: {
          userId: user.id,
          password: newRefreshToken,
          type: PasswordType.REFRESH_TOKEN,
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        roles: userRoles,
      },
    };
  }
}
