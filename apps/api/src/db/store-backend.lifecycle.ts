import { Injectable, type OnApplicationShutdown } from '@nestjs/common'

import { storeBackend } from './store-backend'

/**
 * graceful 종료(SIGTERM/SIGINT, 재배포) 시 인플라이트 write-behind upsert를 드레인해
 * 마지막 쓰기 유실을 막는다. main.ts의 `app.enableShutdownHooks()`가 이 훅을 호출한다.
 * DATABASE_URL 미설정/하이드레이트 실패 시 tails가 비어 있어 no-op이다.
 */
@Injectable()
export class StoreBackendLifecycle implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await storeBackend.flush()
  }
}
