import env from "@configs/env";
import jwt from "jsonwebtoken";

const JWT_SECRET = env.jwtSecret || "fallback_secret";

export const generateToken = (payload: object, expiresIn: string = "3h") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
