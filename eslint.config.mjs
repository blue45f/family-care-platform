import { base, react, plugin, boundaries, defineConfig } from '@heejun/eslint-config'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/data/**',
    '**/*.d.ts',
    '**/*.tsbuildinfo',
    '**/*.config.{js,mjs,cjs,ts}',
  ]),

  // 공유 베이스(TS + import 위생 + 커스텀 규칙 + prettier 충돌 비활성).
  base({ files: ['**/*.{ts,tsx}'] }),

  // shared base 가 다루지 않는, 레포 하드 게이트에 포함된 품질/스타일 규칙을 보존한다.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      'no-useless-escape': 'error',
      'prefer-const': 'error',
      'no-useless-assignment': 'error',
    },
  },

  // apps/web — React 19 + Vite + RC + jsx-a11y.
  react({ files: ['apps/web/**/*.{ts,tsx}'] }),

  // heejun 개인 테스트/목 컨벤션 규칙은 비활성 — 횡단 일관성 대상이 아니라
  // 이 레포 자체 테스트 스타일과 충돌한다(shared base 의 일반 규칙만 채택).
  {
    plugins: { '@heejun': plugin },
    rules: {
      '@heejun/vitest-mock-import': 'off',
      '@heejun/vitest-mock-import-original': 'off',
      '@heejun/mock-response-naming': 'off',
      '@heejun/no-js-interface-direct-access': 'off',
    },
  },

  // apps/web 레포 정책: 네이티브 confirm/alert/prompt 금지(포트폴리오 표준 — DEVELOPMENT.md §5.1).
  // 브랜드 다이얼로그/toast/인라인 알림으로 대체한다. 로컬 변수는 섀도잉이라 영향 없음.
  // RC 진단(react-hooks v7) + hooks 규칙은 하드 에러로 강제한다.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: '브랜드 확인 다이얼로그를 사용하세요 (globalThis.confirm 금지).' },
        { name: 'alert', message: 'toast/인라인 알림을 사용하세요 (globalThis.alert 금지).' },
        { name: 'prompt', message: '브랜드 입력 다이얼로그를 사용하세요 (globalThis.prompt 금지).' },
      ],
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      // react-hooks v7 ships React Compiler diagnostics; enforce them as errors.
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/incompatible-library': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/static-components': 'error',
    },
  },

  // apps/web 계층 경계 — 개발가이드의 app/domains/shared/infrastructure 4계층.
  // app = 라우터/부트스트랩 + 페이지/셸(components/pages·shell 는 재사용 빌딩블록이
  // 아니라 App/appRoutes 만 소비하는 페이지·앱셸 계층이라 물리 위치는 그대로 두고
  // app 으로 매핑한다). shared = 순수 빌딩블록(components/ui·common, utils, styles)
  // 과 루트 유틸. components 는 물리적으로 옮기지 않는다.
  ...boundaries({
    files: ['apps/web/src/**/*.{ts,tsx}'],
    elements: [
      {
        type: 'app',
        pattern:
          'apps/web/src/{app/**/*,components/pages/**/*,components/shell/**/*,App.tsx,appRoutes.tsx,main.tsx,routeConfig.ts,routeNavigation.ts,useRouteMeta.ts,lazyRetry.ts}',
        mode: 'full',
      },
      { type: 'domains', pattern: 'apps/web/src/domains/*/**/*', mode: 'full' },
      {
        type: 'shared',
        pattern:
          'apps/web/src/{components/**/*,utils/**/*,state/**/*,auth/**/*,styles/**/*,types.ts,utils.ts,termsdeskPolicy.ts}',
        mode: 'full',
      },
      { type: 'infrastructure', pattern: 'apps/web/src/infrastructure/**/*', mode: 'full' },
    ],
    rules: [
      { from: ['app'], allow: ['app', 'domains', 'shared', 'infrastructure'] },
      { from: ['domains'], allow: ['domains', 'shared', 'infrastructure'] },
      { from: ['infrastructure'], allow: ['shared', 'infrastructure'] },
      { from: ['shared'], allow: ['shared'] },
    ],
  }),
  // boundaries 는 TS 임포트를 분류하려면 리졸버가 필요하다(없으면 조용히 no-op).
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    settings: {
      'import/resolver': { typescript: { project: 'apps/web/tsconfig.json' }, node: true },
    },
  },
  // 기술부채 완화(의도적·국소): auth/state 부트스트랩은 매핑상 shared 지만 자연스럽게
  // infrastructure(api 클라이언트)를 오케스트레이션한다(auth 스토어의 프로필 patch/탈퇴,
  // usePlatformData 의 데이터 로딩). 이는 offhours 파일럿의 store→infrastructure 완화와
  // 동일한 패턴이다. 순수 shared(components/ui·common, utils, styles, 루트 유틸)는 계속
  // strict 하게 강제한다.
  {
    files: ['apps/web/src/auth/authStore.ts', 'apps/web/src/state/usePlatformData.ts'],
    rules: { 'boundaries/element-types': 'off' },
  },

  // apps/api — NestJS (Node). 데코레이터 + 빈 생성자/클래스 관용.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  // packages/shared — isomorphic (Node).
  {
    files: ['packages/shared/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // 테스트 — Vitest globals; fast-refresh 제약 완화.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  }
)
