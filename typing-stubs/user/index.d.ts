declare namespace Express {
  export interface Request {
    user?: { [key: string]: any } | null;
  }
}
