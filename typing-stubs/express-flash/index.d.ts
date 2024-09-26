declare namespace Express {
  export interface Request {
    flash(event: string, message: any): any;
  }
}

interface Flash {
  flash(type: string, message: any): void;
}

declare module "express-flash";
