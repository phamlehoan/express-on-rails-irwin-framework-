import models from "@models";

/**
 * Chạy callback trong database transaction.
 * Tương tự ActiveRecord::Base.transaction trong Rails.
 */
export async function transaction<T>(
  fn: (prisma: typeof models) => Promise<T>
): Promise<T> {
  return models.$transaction(async (tx) => fn(tx as typeof models));
}
