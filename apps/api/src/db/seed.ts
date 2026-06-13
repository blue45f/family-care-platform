/**
 * 샘플 시드 — data/*.json(파일 기반 시드)을 Neon `collections` 테이블로 적재한다.
 * 기능 점검용 데이터 그대로 이전. 재실행 안전(onConflictDoUpdate). 실행: `pnpm db:seed`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

async function main() {
  if (!process.env.DATABASE_URL && existsSync('.env')) {
    process.loadEnvFile('.env')
  }
  const { db, dbEnabled, pool } = await import('./client')
  const { collections } = await import('./schema')
  if (!dbEnabled || !db) {
    console.error('DATABASE_URL 미설정 — 시드 중단')
    process.exit(1)
  }

  const dir = process.env.FCP_DATA_DIR?.trim() || join(process.cwd(), 'data')
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : []
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
      items?: unknown[]
      seq?: number
    }
    const data = { items: Array.isArray(raw.items) ? raw.items : [], seq: raw.seq }
    await db
      .insert(collections)
      .values({ name: file, data })
      .onConflictDoUpdate({ target: collections.name, set: { data } })
    const count = Array.isArray(data.items) ? data.items.length : 0
    console.log(`✓ seeded ${file} (${count} items)`)
  }
  console.log(`✓ family-care seed done (${files.length} collections)`)
  await pool?.end()
  process.exit(0)
}

main().catch((error) => {
  console.error('seed failed:', error)
  process.exit(1)
})
