# `configs/db/migrations/`

Một thư mục migrate cho cả project. Dev chọn **sqlite** hoặc **postgresql**:

- `app/models/schema.prisma` → `datasource db { provider = "..." }`
- `migration_lock.toml` → cùng provider

Chạy `pnpm db:check` trước khi deploy. Chi tiết: [docs/DATABASE.md](../../docs/DATABASE.md).
