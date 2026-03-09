# API Dev Examples - /api/v1/dev

Các endpoint mẫu tại `/api/v1/dev` (chỉ khi `NODE_ENV=development`).

## REST (7 actions chuẩn Rails)

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/v1/dev/` | index |
| GET | `/api/v1/dev/:id` | show |
| POST | `/api/v1/dev/` | create |
| PUT | `/api/v1/dev/:id` | update |
| DELETE | `/api/v1/dev/:id` | destroy |

## Custom

| Method | Path |
|--------|------|
| GET | `/api/v1/dev/health` |
| GET | `/api/v1/dev/echo?message=Hi&delay=100` |
| GET | `/api/v1/dev/me` |
| POST | `/api/v1/dev/upload` |
| GET | `/api/v1/dev/errors/not-found` |
| GET | `/api/v1/dev/errors/bad-request` |

## Ví dụ cURL

```bash
# Health
curl http://localhost:3000/api/v1/dev/health

# Echo (strong params)
curl "http://localhost:3000/api/v1/dev/echo?message=Hello&delay=0"

# Pagination
curl "http://localhost:3000/api/v1/dev/pagination?page=2&perPage=10"

# Create item
curl -X POST http://localhost:3000/api/v1/dev/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Desc"}'

# Upload (multipart)
curl -X POST http://localhost:3000/api/v1/dev/upload \
  -F "file=@/path/to/image.jpg"

# Errors
curl http://localhost:3000/api/v1/dev/errors/not-found
curl http://localhost:3000/api/v1/dev/errors/bad-request
```

## API Documentation

Khi chạy ở development: http://localhost:3000/api-docs
