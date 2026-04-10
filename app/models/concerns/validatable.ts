/**
 * Validatable concern - tương tự Rails validations.
 * Dùng class-validator (decorators) - gần Rails hơn Zod vì:
 * - Rails: validates :email, presence: true, format: {...}
 * - class-validator: @IsNotEmpty() @IsEmail() - declarative, gắn với model
 *
 * Request params: dùng params(Model).permit('field1', 'field2') trong controller (rails/strongParams).
 * Model validation: dùng validateModel/validateAs ở đây.
 */
import { plainToInstance } from "class-transformer";
import { validate, ValidationError, ValidatorOptions } from "class-validator";
import { UnprocessableEntityError } from "ts-rails";

const defaultOptions: ValidatorOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
};

export function formatValidationErrors(
  errors: ValidationError[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const err of errors) {
    const key = err.property;
    if (err.constraints) {
      result[key] = Object.values(err.constraints);
    } else if (err.children?.length) {
      const childErrors = formatValidationErrors(err.children);
      for (const [k, v] of Object.entries(childErrors)) {
        result[`${key}.${k}`] = v;
      }
    }
  }
  return result;
}

/** Validate instance (vd: model từ DB) - dùng cho model-level validation */
export async function validateModel<T extends object>(
  instance: T,
  options?: ValidatorOptions,
): Promise<void> {
  const errors = await validate(instance, { ...defaultOptions, ...options });
  if (errors.length > 0) {
    const formatted = formatValidationErrors(errors);
    throw new UnprocessableEntityError("Validation failed", formatted);
  }
}

/** Validate plain object thành class - dùng cho model/form, request params dùng params.permit() */
export async function validateAs<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<T> {
  const instance = plainToInstance(cls, plain);
  await validateModel(instance);
  return instance;
}
