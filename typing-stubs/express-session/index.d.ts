import "express-session";

declare module "express-session" {
  export interface Session {
    user?: { [key: string]: any };
    userId?: string;
  }

  interface SessionData {
    userId?: string;
  }
}
