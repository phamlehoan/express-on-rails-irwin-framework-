import "jsonwebtoken";

declare module "jsonwebtoken" {
  export interface CustomJwtPayload extends JwtPayload {
    userId: string;
    user?: { [key: string]: any };
    [key: string]: any;
  }

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: VerifyOptions
  ): CustomJwtPayload;
}
