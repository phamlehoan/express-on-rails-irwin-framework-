# Kiến trúc & So sánh với Ruby on Rails

## 1. Độ tương đương với Ruby on Rails

| Thành phần | Rails | Irwin Framework | % |
|------------|-------|-----------------|---|
| **MVC** | Controllers, Models, Views | ✓ Controllers, Prisma Models, Pug Views | 90% |
| **Routing** | resources, nested | ✓ Route.resource, nested | 85% |
| **Strong Parameters** | params.require().permit() | ✓ params(Model).permit('field1','field2') + class-validator | 95% |
| **Validations** | Model validations | ✓ class-validator (app/validators/) | 90% |
| **Error handling** | rescue_from | ✓ action() dispatch + global error handler | 85% |
| **before_action** | before_action :authenticate | ✓ Middleware | 90% |
| **Service Objects** | app/services/ | ✓ app/services/ | 85% |
| **Pagination** | Kaminari, will_paginate | ✓ parsePagination, buildPaginatedResponse | 80% |
| **Permissions** | Pundit, CanCanCan | ✓ ValidateUserPermissionMiddleware | 75% |
| **API versioning** | namespace :api do | ✓ /api/v1 | 90% |
| **Background jobs** | Active Job | ✓ node-cron (app/jobs/) | 70% |
| **Caching** | Rails.cache | ✓ node-cache (lib/cache.ts) | 80% |
| **Generators** | rails g scaffold | Chưa có | 0% |
| **Migrations** | ActiveRecord | Prisma | 90% |
| **I18n** | I18n.t | ✓ i18next (configs/locales/) | 85% |
| **Logging** | Rails.logger | ✓ Pino (lib/logger.ts) | 90% |
| **Health/Ready** | /up, /ready | ✓ /health, /ready | 90% |
| **Mailers** | ActionMailer | ✓ app/mailers/ | 80% |
| **Concerns** | app/concerns/ | ✓ app/controllers/concerns/, app/models/concerns/ | 85% |
| **Model validations** | validates | ✓ class-validator (app/models/concerns/validatable.ts) | 80% |
| **Asset pipeline** | Webpacker/Vite | ✓ Vite (yarn build-client:vite) | 85% |

**Tổng ước lượng: ~85%** cho core API patterns.

### Còn cần thêm để giống Rails hơn

| Thành phần | Mô tả | Độ ưu tiên |
|------------|-------|------------|
| **Generators** | `rails g scaffold User` → tạo model, migration, controller, routes | Cao |
| **Fixtures/Factory** | test/fixtures, FactoryBot cho test data | Trung bình |
| **Rake tasks** | lib/tasks/*.rake, `rails db:seed` | Trung bình |
| **Turbo/Hotwire** | SPA-like UX không cần viết API | Thấp |
| **ActionCable** | WebSocket, real-time | Thấp |

### Lý do chọn class-validator thay Zod (giống Rails hơn)

| Rails | class-validator | Zod |
|-------|-----------------|-----|
| `validates :email, presence: true, format: {...}` | `@IsNotEmpty() @IsEmail()` | `z.string().email()` |
| Declarative, gắn với model/class | ✓ Decorators trên class | Schema riêng, không gắn class |
| Attribute-based validation | ✓ | Schema-based |

---

## 2. Schemas – Cách Rails giải quyết & áp dụng

### Rails không có thư mục `schemas/`

Rails đặt validation **gần nơi dùng**:

- **Model validations** → trong `app/models/user.rb`
- **Strong parameters** → trong controller: `params.require(:user).permit(:name, :email)`
- **Form objects** (Reform, Dry-validation) → thường `app/forms/` hoặc `app/validators/`

### Vấn đề thư mục schemas phồng to

Nếu giữ `app/schemas/`:

```
app/schemas/
  auth.schema.ts
  user.schema.ts
  userCreate.schema.ts
  userUpdate.schema.ts
  order.schema.ts
  orderItem.schema.ts
  ... (hàng trăm file khi scale)
```

### Giải pháp đã áp dụng: validators (Rails-style)

**Validators:** class-validator với decorators, giống Rails `validates`.

```
app/validators/
  common.validator.ts  ← PaginationValidator (dùng chung)
  auth.validator.ts    ← GoogleVerifyValidator
  dev.validator.ts     ← EchoValidator, CreateItemValidator, UpdateItemValidator
  admin.validator.ts   ← CreateUserValidator, UpdateUserValidator, RoleUpdateValidator
```

Khi clone API:

1. Copy route file
2. Tạo validator class mới (hoặc dùng chung)
3. params(MyValidator).permit('field1', 'field2') trong controller

---

## 3. Swagger – Co-locate với route

### Trước

Mỗi API mới phải sửa `configs/swagger.ts` → dễ quên, dễ lệch với code.

### Sau: registry pattern

Mỗi route file export `*SwaggerPaths`:

```typescript
// auth.route.ts
export const authSwaggerPaths = {
  "/auth/google/verify": {
    post: { summary: "Verify Google", ... }
  }
};
```

`configs/routes/api/v1/index.ts` đăng ký:

```typescript
registerSwaggerPaths(authSwaggerPaths);
registerSwaggerPaths(devSwaggerPaths);
```

**Clone API:** copy `auth.route.ts` → `user.route.ts` → swagger và route cùng file, không cần sửa config trung tâm.

### Template clone API mới

1. Copy `auth.route.ts` → `users.route.ts`
2. Copy `auth.schemas.ts` → `users.schemas.ts`
3. Trong `v1/index.ts` thêm:
   ```typescript
   import { UsersRoute, usersSwaggerPaths } from "./users.route";
   registerSwaggerPaths(usersSwaggerPaths);
   this.path.use("/users", UsersRoute.draw());
   ```
