import { defineConfig } from 'drizzle-kit'

// 운영 DB = Neon(서비스 전용 free 프로젝트). DATABASE_URL로 연결(sslmode=require).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/family_care',
  },
})
