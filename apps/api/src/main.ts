import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";

import { AppModule } from "./app.module";
import { isCorsOriginAllowed, resolveAllowedOrigins } from "./common/cors-policy";
import { AllExceptionsFilter } from "./http-exception.filter";

type OriginCheck = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;

function createCorsOriginResolver(): OriginCheck {
  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    try {
      callback(null, isCorsOriginAllowed(origin, resolveAllowedOrigins()));
    } catch (error) {
      callback(error instanceof Error ? error : new Error("CORS origin check error"));
    }
  };
}

// 의존성 없는 기본 보안 응답 헤더. CORS/JSON 스토어 동작에는 영향을 주지 않는다.
function applySecurityHeaders(_request: Request, response: Response, next: NextFunction): void {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex");
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  const logger = new Logger("Bootstrap");
  const allowedOriginPatterns = resolveAllowedOrigins();

  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.use(applySecurityHeaders);

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
