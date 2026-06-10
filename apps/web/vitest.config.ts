import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // styles.spec.ts가 styles.css?raw로 토큰 대비를 검증한다 — css:false면 빈 문자열로 스텁됨.
    css: true,
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
  },
})
