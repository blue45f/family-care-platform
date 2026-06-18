import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { App } from './App'
import { queryClient } from './app/queryClient'
import { AuthProvider } from './auth/AuthProvider'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { RouteFallback } from './components/common/RouteFallback'
import { DeskCloudWidgets } from './components/deskcloud/DeskCloudWidgets'
import { FeedbackWidget } from './components/feedback/FeedbackWidget'
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
            {/* SurveyDesk 피드백 위젯: endpoint(env)가 설정된 경우에만 마운트한다.
                미설정(기본값)이면 렌더하지 않아 앱에 전혀 영향을 주지 않는다. */}
            {import.meta.env.VITE_SURVEYDESK_URL && (
              <FeedbackWidget appId="familycare" endpoint={import.meta.env.VITE_SURVEYDESK_URL} />
            )}
            {/* DeskCloud 위젯(Changelog·Notify·Search·Chat·Media): 각 VITE_*_URL 이
                설정된 경우에만 해당 위젯이 마운트된다. 미설정이면 아무것도 렌더하지 않는다. */}
            <DeskCloudWidgets />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
