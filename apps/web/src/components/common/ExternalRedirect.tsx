import { useEffect } from 'react'

type ExternalRedirectProps = {
  to: string
}

/**
 * 외부 문서(TermsDesk 공개 정책 등)로 즉시 이동시키는 라우트 컴포넌트.
 * history에 흔적을 남기지 않도록 replace를 쓰고, 이동 전 잠깐 보이는
 * 안내 문구를 스크린리더에도 알린다.
 */
export const ExternalRedirect = ({ to }: ExternalRedirectProps) => {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return <div aria-live="polite">외부 정책 문서로 이동 중입니다...</div>
}
