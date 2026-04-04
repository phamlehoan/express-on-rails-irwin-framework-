import bcrypt from "bcrypt";
import { RailsApplication } from "ts-rails";

export function initializeHash() {
  // Cấu hình Password Hasher (Bcrypt) cho RailsApplication
  RailsApplication.hasher = {
    hash: async (password) => bcrypt.hash(password, 10),
    verify: async (password, hash) => bcrypt.compare(password, hash),
  };
}
