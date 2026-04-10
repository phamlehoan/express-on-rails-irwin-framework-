import { Transform } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

export { PaginationValidator } from "./common.validator";

export class EchoValidator {
  static schema = { message: "string", delay: "number" } as const;

  @IsOptional()
  @Transform(({ value }) => value ?? "Hello")
  @IsString()
  message?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : 0))
  @IsNumber()
  @Min(0)
  @Max(5000)
  delay?: number;
}

export class CreateItemValidator {
  @IsString()
  @MinLength(1, { message: "Name is required" })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateItemValidator {
  static schema = { name: "string", description: "string" } as const;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
