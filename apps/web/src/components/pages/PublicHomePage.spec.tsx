import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AuthContext, type AuthState } from '../../lib/firebaseAuth/context'

import { PublicHomePage } from './PublicHomePage'

// PublicHomePage 헤더는 통합 회원 로그인(Firebase) 컨트롤(useAuth 소비)을 포함한다. 정적
// 렌더 시 실제 Firebase Provider(firebase.ts) 를 import 하면 node 빌드의 getAuth 가 apiKey
// 검증을 즉시 수행하므로, 여기서는 컨텍스트만 스텁(로그아웃·loading=false)으로 주입한다.
// 이렇게 하면 env 와 무관하게 결정론적으로 "회원 로그인" 진입점을 검증할 수 있다.
const stubAuth: AuthState = {
  user: null,
  loading: false,
  error: null,
  signUp: async () => undefined,
  signIn: async () => undefined,
  signInAsGuest: async () => undefined,
  signOut: async () => undefined,
  clearError: () => undefined,
}

const renderHome = () =>
  renderToStaticMarkup(
    createElement(
      AuthContext,
      { value: stubAuth },
      createElement(PublicHomePage, { onNavigate: () => undefined })
    )
  )

describe('PublicHomePage', () => {
  it('비로그인 방문자에게 제품 정체성과 시작 동선을 먼저 설명한다', () => {
    const markup = renderHome()

    expect(markup).toContain('가족 돌봄 운영 플랫폼')
    expect(markup).toContain('방문 일정부터 보험청구까지')
    expect(markup).toContain('데모 계정으로 둘러보기')
    expect(markup).toContain('로그인')
    expect(markup).toContain('회원가입')
    expect(markup).toContain('시작 가이드')
    expect(markup).toContain('요금제')
  })

  it('상세 사용 가이드 페이지로 바로갈 수 있는 요소를 노출한다', () => {
    const markup = renderHome()

    expect(markup).toContain('FAQ 검색')
    expect(markup).toContain('질문 또는 답변 내용으로 검색')
    expect(markup).toContain('데모 상담 신청')
    expect(markup).toContain('입력 내용 비우기')
  })

  it('상단 네비게이션은 핵심 동선(앵커 3 + 담당자 로그인/회원가입 + 통합 회원 로그인)을 노출한다', () => {
    const markup = renderHome()

    const nav = markup.match(/<nav class="public-nav-actions"[^>]*>([\s\S]*?)<\/nav>/)?.[1]
    if (!nav) throw new Error('마크업에서 public-nav-actions 네비게이션을 찾지 못했습니다')

    // 핵심 동선: 앵커 3 + 담당자 로그인 + 회원가입 = 5(통합 회원 로그인 컨트롤과 별개).
    expect(nav).toContain('핵심 기능')
    expect(nav).toContain('요금 안내')
    expect(nav).toContain('자주 묻는 질문')
    expect(nav).toContain('담당자 로그인')
    expect(nav).toContain('회원가입')

    // 통합 회원 로그인(Firebase) 진입점 — 운영 콘솔 로그인과 별개의 추가 옵션.
    // env(VITE_FIREBASE_*)가 설정되면 초기엔 onAuthStateChanged 해석 전 플레이스홀더를,
    // 미설정이면 곧장 "회원 로그인" 버튼을 렌더한다. 두 상태 모두에서 진입점이 존재함을 확인한다.
    const hasMemberLoginEntry = nav.includes('회원 로그인') || nav.includes('animate-pulse')
    expect(hasMemberLoginEntry).toBe(true)
  })

  it('푸터가 약관·개인정보·문의(모두 내부 페이지)와 페이지 링크 묶음을 제공한다', () => {
    const markup = renderHome()

    const footer = markup.match(/<footer[\s\S]*?<\/footer>/)?.[0]
    if (!footer) throw new Error('마크업에서 푸터를 찾지 못했습니다')

    expect(footer).toContain('이용약관')
    expect(footer).toContain('개인정보 처리방침')
    // 문의는 내부 문의 게시판(/inquiry) 라우트 버튼으로 통합한다.
    expect(footer).toContain('문의')
    // 약관·개인정보는 내부 라우트 버튼으로 이동한다(외부 termsdesk 문서 링크 아님).
    expect(footer).not.toContain('terms-of-service')
    expect(footer).not.toContain('privacy-policy')
    // 외부 연락 채널(TermsDesk 지원 링크)은 더 이상 노출하지 않는다(내부 게시판으로 통합).
    expect(footer).not.toContain('termsdesk.vercel.app/support')
    expect(footer).toContain('서비스 소개')
    expect(footer).toContain('시작 가이드')
    expect(footer).toContain('튜토리얼')
    expect(footer).toContain('커뮤니티 데모')
    expect(footer).toContain('요금제')
  })
})
