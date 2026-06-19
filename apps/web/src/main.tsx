import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { App } from './App'
import { queryClient } from './app/queryClient'
import { AuthProvider } from './auth/AuthProvider'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { RouteFallback } from './components/common/RouteFallback'
import { DeskSearchPalette } from './components/desk/DeskSearchPalette'
import { FeedbackWidget } from './components/feedback/FeedbackWidget'
import { validateWebEnv } from './infrastructure/env'
import { lazyRetry } from './lazyRetry'
// 통합 회원 로그인(Firebase Auth) — 기존 운영 콘솔 로그인(./auth/AuthProvider)과 별개로,
// 이메일/비번 + 게스트 옵션을 헤더에서 제공한다. env(VITE_FIREBASE_*) 미설정이면 무해하게
// degrade 한다(빌드/런타임 크래시 없음). 이름 충돌을 피해 별칭(MemberAuthProvider)으로 가져온다.
import { AuthProvider as MemberAuthProvider } from './lib/firebaseAuth'

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
        <MemberAuthProvider>
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
              {/* SurveyDesk 피드백 런처(1차 기능): endpoint(env)가 설정된 경우에만 마운트한다.
                미설정(기본값)이면 렌더하지 않아 앱에 전혀 영향을 주지 않는다. */}
              {import.meta.env.VITE_SURVEYDESK_URL && (
                <FeedbackWidget appId="familycare" endpoint={import.meta.env.VITE_SURVEYDESK_URL} />
              )}
              {/* SearchDesk(네이티브 ⌘K 팔레트): VITE_SEARCHDESK_URL 설정 시에만 단축키를
                등록하고, 결과를 이 앱의 디자인 토큰으로 렌더한다. 미설정이면 무영향.
                Changelog·Notify 는 각각 가이드/대시보드에 네이티브 카드로 인라인했다. */}
              <DeskSearchPalette />
            </BrowserRouter>
          </AuthProvider>
        </MemberAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
