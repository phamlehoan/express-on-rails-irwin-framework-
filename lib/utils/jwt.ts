import env from "@configs/env";
import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload extends jwt.JwtPayload {
  id?: string;
}

const JWT_SECRET = env.jwtSecret || "fallback_secret";

export class JwtService {
  private secret: string;
  constructor(secret: string) {
    this.secret = secret;
  }
  generateToken(payload: object, expiresIn: string = "3h") {
    const options: SignOptions = {
      expiresIn: expiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, this.secret, options);
  }
  verifyToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.secret);
    if (typeof decoded === "string") throw new Error("Invalid token payload");
    return decoded as JwtPayload;
  }
}

let jwtServiceInstance: JwtService;

export const getJwtService = (): JwtService => {
  if (!jwtServiceInstance) {
    jwtServiceInstance = new JwtService(JWT_SECRET);
  }
  return jwtServiceInstance;
};

export const verifyToken = (token: string) =>
  getJwtService().verifyToken(token);
export const generateToken = (payload: object, expiresIn: string = "3h") =>
  getJwtService().generateToken(payload, expiresIn);
