/**
 * Danh sách features - khi thêm tính năng mới, thêm vào đây.
 * Chạy: yarn db:seed
 */
import { registerFeature, setFeatureParents, assignPermissionToRole, ensureRole } from "./registerFeature";

export const FEATURES = [
  {
    code: "AM",
    name: "Administration Management",
    description: "Quản lý users, permissions, roles",
    type: "MENU_GROUP",
    parentCode: null as string | null,
    sortOrder: 0,
  },
  {
    code: "UM",
    name: "User Management",
    description: "Quản lý tài khoản người dùng",
    type: "FEATURE",
    parentCode: "AM",
    sortOrder: 0,
  },
  {
    code: "TASK",
    name: "Task",
    description: "Quản lý công việc",
    type: "MENU_GROUP",
    parentCode: null as string | null,
    sortOrder: 1,
  },
  {
    code: "TASK_TYPE",
    name: "Task Type",
    description: "Loại công việc",
    type: "FEATURE",
    parentCode: "TASK",
    sortOrder: 0,
  },
  // Thêm feature mới ở đây:
  // { code: "NEW_FEATURE", name: "New Feature", description: "...", parentCode: "PARENT_CODE" },
];

export async function seedFeatures() {
  for (const def of FEATURES) {
    await registerFeature(def);
  }
  await setFeatureParents(FEATURES);

  // Role ADMIN phải tồn tại trước khi gán permission (tạo nếu chưa có)
  await ensureRole("ADMIN", "Administrator", "Full access to admin and user management");

  // ADMIN role có full quyền AM và UM
  await assignPermissionToRole("ADMIN", "AM");
  await assignPermissionToRole("ADMIN", "UM");
  console.log("[seedFeatures] Done");
}
