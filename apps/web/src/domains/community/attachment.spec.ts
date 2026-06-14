import { describe, expect, it } from 'vitest'

import { attachmentErrorMessage, fitWithin, formatByteSize } from './attachment'

describe('community attachment 클라이언트 정책', () => {
  it('fitWithin은 긴 변 1600px 기준으로 비율을 유지하며 줄이고, 확대는 하지 않는다', () => {
    expect(fitWithin(3200, 1600)).toEqual({ width: 1600, height: 800 })
    expect(fitWithin(1200, 2400)).toEqual({ width: 800, height: 1600 })
    expect(fitWithin(1600, 900)).toEqual({ width: 1600, height: 900 })
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 })
    // 극단 비율에서도 최소 1px을 보장한다.
    expect(fitWithin(20000, 2, 1600).height).toBeGreaterThanOrEqual(1)
  })

  it('attachmentErrorMessage는 개수 한도 → 형식 → PDF 크기 순으로 거른다', () => {
    const png = { name: 'a.png', type: 'image/png', size: 10 * 1024 * 1024 }
    expect(attachmentErrorMessage(png, 4)).toContain('최대 4개')
    // 이미지는 리사이즈로 줄어들 수 있어 원본 크기만으로 거르지 않는다.
    expect(attachmentErrorMessage(png, 0)).toBeNull()

    expect(attachmentErrorMessage({ name: 'x.gif', type: 'image/gif', size: 10 }, 0)).toContain(
      '허용되지 않는 형식'
    )

    const bigPdf = { name: 'doc.pdf', type: 'application/pdf', size: 2 * 1024 * 1024 + 1 }
    expect(attachmentErrorMessage(bigPdf, 0)).toContain('2MB 이하')
    const okPdf = { name: 'doc.pdf', type: 'application/pdf', size: 1024 }
    expect(attachmentErrorMessage(okPdf, 3)).toBeNull()
  })

  it('formatByteSize는 사람이 읽기 좋은 단위로 표기한다', () => {
    expect(formatByteSize(512)).toBe('512B')
    expect(formatByteSize(2048)).toBe('2KB')
    expect(formatByteSize(2 * 1024 * 1024)).toBe('2.0MB')
  })
})
