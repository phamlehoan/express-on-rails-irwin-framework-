import { NotFoundError } from "ts-rails";
import { ApplicationService } from "../application.service";

export type UpdateMyProfileInput = {
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
};

export class AuthUpdateProfileService extends ApplicationService {
  async execute(userId: string, input: UpdateMyProfileInput) {
    const existing = await this.models.user.findFirst({
      where: { id: userId, deleted: false },
    });
    if (!existing) throw new NotFoundError("User not found");

    await this.models.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.middleName !== undefined && { middleName: input.middleName }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.phoneNumber !== undefined && {
          phoneNumber: input.phoneNumber,
        }),
        ...(input.address !== undefined && { address: input.address }),
      },
    });

    const user = await this.models.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundError("User not found");

    const roles = user.roles.map((r: { role: { code: string } }) => r.role.code);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        fullName: `${user.firstName} ${user.lastName}`,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        address: user.address,
        status: user.status,
        roles,
      },
    };
  }
}
