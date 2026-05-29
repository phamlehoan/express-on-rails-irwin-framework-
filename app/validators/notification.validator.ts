import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

const toArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];

export class NotificationListQueryValidator {
  static schema = { unread: "string", limit: "number" } as const;

  @IsOptional()
  @IsString()
  unread?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : undefined))
  limit?: number;
}

export class PushTokenValidator {
  static schema = {
    token: "string",
    platform: "string",
    deviceId: "string",
    appVersion: "string",
  } as const;
  static required = ["token"] as const;

  @IsString()
  @MinLength(1)
  token!: string;

  @IsOptional()
  @IsIn(["ANDROID", "IOS", "WEB"])
  platform?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class SendNotificationValidator {
  static schema = {
    title: "string",
    message: "string",
    type: "string",
  } as const;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
