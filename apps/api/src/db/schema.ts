import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

// 가족돌봄 API의 컬렉션 스토어(JsonCollectionStore)를 Neon Postgres로 옮기기 위한
// 제네릭 테이블 — 컬렉션 1개당 행 1개로 `{ items, seq }` 상태를 JSONB로 보관한다.
// 서비스/모델 코드는 그대로 `{ items, seq }`로 동작한다(점진적 정규화는 후속 작업).
export const collections = pgTable('collections', {
  name: text('name').primaryKey(), // 예: 'care-logs.json'
  data: jsonb('data').$type<{ items: unknown[]; seq?: number }>().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
})
