import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

const toArray = (v: unknown): string[] =>
  Array.isArray(v) ? v : v ? [String(v)] : [];

export { PaginationValidator } from "./common.validator";

/** Schema cho Swagger - @ApiDoc({ body: CreateUserValidator }) */
export class CreateUserValidator {
  static schema = {
    firstName: "string",
    lastName: "string",
    email: "string",
    roleIds: "string[]",
  } as const;
  static required = ["firstName", "lastName", "email"] as const;

  @IsString()
  @MinLength(1, { message: "First name is required" })
  firstName!: string;

  @IsString()
  @MinLength(1, { message: "Last name is required" })
  lastName!: string;

  @IsEmail({}, { message: "Invalid email" })
  email!: string;

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  roleIds?: string[];
}

export class UpdateUserValidator {
  @IsOptional()
  @IsIn(["personal", "roles", "permissions"], {
    message: "Section must be personal, roles or permissions",
  })
  section?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email" })
  email?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE", "PENDING"], {
    message: "Status must be ACTIVE, INACTIVE or PENDING",
  })
  status?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  roleIds?: string[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  permissionIds?: string[];
}

export class RoleCreateValidator {
  @IsString()
  @MinLength(1, { message: "Code is required" })
  code!: string;

  @IsString()
  @MinLength(1, { message: "Name is required" })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RoleUpdateValidator {
  static schema = {
    permissionIds: "string[]",
    code: "string",
    name: "string",
    description: "string",
  } as const;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  permissionIds?: string[];
}

export class FeatureCreateValidator {
  @IsString()
  @MinLength(1, { message: "Code is required" })
  code!: string;

  @IsString()
  @MinLength(1, { message: "Name is required" })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["MENU_GROUP", "FEATURE", "SYSTEM"])
  type?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  sortOrder?: number;
}

export class FeatureUpdateValidator {
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["MENU_GROUP", "FEATURE", "SYSTEM"])
  type?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  sortOrder?: number;
}
