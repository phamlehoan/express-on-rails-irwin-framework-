/**
 * Validators dùng chung - Pagination, etc.
 * static schema: dùng cho Swagger (@ApiDoc body/params)
 */
import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class HomePageValidator {
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : 1))
  @IsInt()
  @Min(1)
  currentPage?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class PaginationValidator {
  static schema = { page: "number", perPage: "number" } as const;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}
