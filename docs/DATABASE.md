# Chọn database (SQLite / Turso / Supabase)

Một thư mục migrate: **`configs/db/migrations/`**. Dev chọn **một** loại DB cho project — `schema.prisma`, `migration_lock.toml` và env phải khớp nhau.

| Mục tiêu | `schema.prisma` | `migration_lock.toml` | Biến môi trường |
|----------|-----------------|-------------------------|-----------------|
| SQLite local | `sqlite` | `sqlite` | `DATABASE_URL=file:./database/app.db` |
| Turso (SQLite cloud) | `sqlite` | `sqlite` | `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |
| Supabase (PostgreSQL) | `postgresql` | `postgresql` | `DATABASE_URL=postgresql://...` |

## Chọn SQLite / Turso (mặc định repo)

1. `app/models/schema.prisma` → `provider = "sqlite"`
2. `configs/db/migrations/migration_lock.toml` → `provider = "sqlite"`
3. Env: `DATABASE_URL` hoặc `TURSO_*` (xem `.env.example`)
4. `pnpm db:generate` → `pnpm db:deploy:auto`

## Chọn Supabase (PostgreSQL)

Khi **đổi sang Postgres** lần đầu (project mới hoặc từ SQLite):

1. `schema.prisma` → `provider = "postgresql"`
2. `migration_lock.toml` → `provider = "postgresql"`
3. Xóa hoặc đổi tên thư mục `configs/db/migrations/*` (migration SQL cũ là SQLite).
4. Tạo lại migration cho Postgres:

   ```bash
   pnpm db:migrate
   ```

   (Prisma tạo SQL phù hợp PostgreSQL trong cùng thư mục `migrations/`.)

5. `DATABASE_URL` = connection string Supabase (Settings → Database).
6. `pnpm db:deploy:auto`

**Không** trộn migration SQLite và PostgreSQL trong cùng một lịch sử migrate — mỗi team/project giữ một provider.

## Lệnh

| Lệnh | Mô tả |
|------|--------|
| `pnpm db:check` | schema, lock, URL khớp nhau |
| `pnpm db:deploy:auto` | Turso → runner SQLite; còn lại → `prisma migrate deploy` |
| `pnpm db:migrate` | `prisma migrate dev` |

## Supabase

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@....pooler.supabase.com:6543/postgres
```

## Turso

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Giữ `provider = "sqlite"` trong schema và lock.
