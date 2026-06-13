import { existsSync } from 'node:fs'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

// 로컬 dev: .env에서 DATABASE_URL 로드(운영은 플랫폼이 env 주입). 모듈 로드 시 1회.
if (!process.env.DATABASE_URL && existsSync('.env')) {
  try {
    process.loadEnvFile('.env')
  } catch {
    // 무시 — env 없이도 파일 백엔드로 폴백
  }
}

// DATABASE_URL(Neon) 미설정 시 null — 그 경우 JsonCollectionStore는 파일 백엔드로 폴백한다.
// 풀 슬림화: Neon 무료 컴퓨트(autosuspend) 비용 가드 — 유휴 연결을 빨리 닫는다.
const url = process.env.DATABASE_URL
export const pool = url
  ? new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    })
  : null

export const db = pool ? drizzle(pool, { schema }) : null
export const dbEnabled = Boolean(pool)
