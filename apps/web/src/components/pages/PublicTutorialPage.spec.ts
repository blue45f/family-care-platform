import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PublicTutorialPage } from './PublicTutorialPage'

describe('PublicTutorialPage', () => {
  it('초보자에게 전체 동선과 시나리오를 먼저 보여준다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicTutorialPage, { onNavigate: () => undefined })
    )

    expect(markup).toContain('공개 튜토리얼')
    expect(markup).toContain('3~10분으로 기본 업무 흐름을 점검하세요')
    expect(markup).toContain('추천 운영 시퀀스')
    expect(markup).toContain('도입 유형별 추천 시작점')
    expect(markup).toContain('역할/목표별 추천 흐름')
    expect(markup).toContain('신규 담당자 1일차 적응')
  })

  it('진행 체크리스트와 FAQ가 노출된다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicTutorialPage, { onNavigate: () => undefined })
    )

    expect(markup).toContain('10분 체크리스트')
    expect(markup).toContain('진행률')
    expect(markup).toContain('진행 요약 복사')
    expect(markup).toContain('데모에서 바로 실행')
    expect(markup).toContain('자주 묻는 질문')
    expect(markup).toContain('튜토리얼에서 무엇을 먼저 보면 좋나요?')
    expect(markup).toContain('운영을 안정적으로 확장하는 기준')
  })

  it('운영 데모 미션과 시나리오 지표가 노출된다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicTutorialPage, { onNavigate: () => undefined })
    )

    expect(markup).toContain('운영 데모 미션')
    expect(markup).toContain('화면 탐색 커버리지')
    expect(markup).toContain('주요 화면 탐색 현황')
    expect(markup).toContain('시나리오 완주율')
  })
})
