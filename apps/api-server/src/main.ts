import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./http-exception.filter";

type OriginCheck = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;

function resolveAllowedOrigins(): string[] {
  const envValue = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (!envValue) {
    const appUrl = process.env.CORS_ALLOWED_ORIGIN?.trim();
    return appUrl ? [appUrl] : [];
  }

  return envValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  const explicitOrigins = resolveAllowedOrigins();
  const isProduction = process.env.NODE_ENV === "production";

  const localOrigins = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
  if (!isProduction) {
    return localOrigins.some((pattern) => pattern.test(origin)) || explicitOrigins.includes(origin);
  }

  return explicitOrigins.includes(origin);
}

function createCorsOriginResolver(): OriginCheck {
  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    try {
      callback(null, isOriginAllowed(origin));
    } catch (error) {
      callback(error instanceof Error ? error : new Error("CORS origin check error"));
    }
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  const logger = new Logger("Bootstrap");
  const allowedOriginPatterns = resolveAllowedOrigins();

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: createCorsOriginResolver(),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  logger.log(`환경 변수 CORS 허용 목록: ${allowedOriginPatterns.length ? allowedOriginPatterns.join(", ") : "<기본 로컬 허용>"} `);
  logger.log(`허용 Origin 패턴: ${process.env.NODE_ENV === "production" ? "명시값 필수" : "로컬 포함"}`);

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
