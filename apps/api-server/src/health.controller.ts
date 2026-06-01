import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  healthCheck() {
    return {
      status: "ok",
      service: "family-care-operations-api",
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
    };
  }
}
