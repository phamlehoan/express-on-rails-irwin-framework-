declare namespace Express {
  export interface Request {
    user?: { [key: string]: any } | null;
    /** Dữ liệu đã validate bởi params.permit() */
    validated?: unknown;
    /** X-Request-ID cho tracing */
    requestId?: string;
  }
}
