/**
 * Đảm bảo database URL có tham số connection_limit để tối ưu cho Serverless
 */
export const formatPrismaUrl = (url: string, limit: number): string => {
  if (url.includes("connection_limit")) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=${limit}`;
};
