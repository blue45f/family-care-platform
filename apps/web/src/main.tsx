import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { App } from './App'
import { queryClient } from './app/queryClient'
import { AuthProvider } from './auth/AuthProvider'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { RouteFallback } from './components/common/RouteFallback'
import { validateWebEnv } from './infrastructure/env'
import { lazyRetry } from './lazyRetry'

import './styles/tailwind.css'
import './styles.css'

// VITE_* 환경 변수 검증(NON-FATAL) — 경고만, throw 없음.
validateWebEnv()

// /design 은 인증 게이트 밖에서 동작하는 공개 디자인 시스템 가이드다. 타입드
// AppRoute 시스템(routeConfig.ts) 밖의 독립 라우트로 둬 라우트 스펙·캐노니컬라이즈
// 로직에 영향을 주지 않으며, 비로그인 상태에서도 접근할 수 있다.
const DesignSystemPage = lazyRetry(() =>
  import('./components/pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage }))
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/design"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <DesignSystemPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<App />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
