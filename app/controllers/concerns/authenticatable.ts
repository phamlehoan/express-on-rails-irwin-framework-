import { User } from "@prisma/client";
import { Request } from "express";

/**
 * Authenticatable concern - tương tự Rails before_action :authenticate_user!
 * Controller include concern này có thể dùng currentUser.
 */
export interface AuthenticatableRequest extends Request {
  user?: (User & { permissions?: string[] }) | null;
}

export function requireAuth(req: AuthenticatableRequest): void {
  if (!req.user) {
    throw new (require("@lib/errors").UnauthorizedError)(
      "You have to login first.",
    );
  }
}
