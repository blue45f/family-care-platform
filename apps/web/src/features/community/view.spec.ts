import { describe, expect, it } from 'vitest'

import {
  buildCommentThreads,
  formatRelativeIso,
  normalizeApiErrorMessage,
  visibleCommentCount,
} from './view'
import type { CommunityComment } from '../../types'

const comment = (
  id: number,
  parentId: number | null,
  overrides: Partial<CommunityComment> = {}
): CommunityComment => ({
  id,
  postId: 1,
  parentId,
  authorId: 1,
  authorName: '사람',
  body: `댓글 ${id}`,
  createdAt: new Date(2026, 0, id).toISOString(),
  deleted: false,
  ...overrides,
})

describe('buildCommentThreads', () => {
  it('최상위 댓글 아래에 1단 답글을 순서대로 묶는다', () => {
    const threads = buildCommentThreads([
      comment(1, null),
      comment(2, 1),
      comment(3, null),
      comment(4, 1),
    ])
    expect(threads.map((t) => t.comment.id)).toEqual([1, 3])
    expect(threads[0].replies.map((r) => r.id)).toEqual([2, 4])
    expect(threads[1].replies).toEqual([])
  })

  it('부모를 잃은 답글은 최상위로 승격해 잃지 않는다', () => {
    const threads = buildCommentThreads([comment(1, null), comment(5, 99)])
    expect(threads.map((t) => t.comment.id)).toEqual([1, 5])
  })

  it('삭제 placeholder도 스레드 구조는 보존하고, 노출 수 집계에서만 빠진다', () => {
    const list = [comment(1, null, { deleted: true, body: '' }), comment(2, 1)]
    const threads = buildCommentThreads(list)
    expect(threads[0].comment.deleted).toBe(true)
    expect(threads[0].replies).toHaveLength(1)
    expect(visibleCommentCount(list)).toBe(1)
  })
})

describe('formatRelativeIso', () => {
  const base = Date.parse('2026-06-10T12:00:00.000Z')

  it('분/시간/일 단위 상대 표기와 30일 이후 날짜 표기를 반환한다', () => {
    expect(formatRelativeIso('2026-06-10T11:59:40.000Z', base)).toBe('방금 전')
    expect(formatRelativeIso('2026-06-10T11:30:00.000Z', base)).toBe('30분 전')
    expect(formatRelativeIso('2026-06-10T07:00:00.000Z', base)).toBe('5시간 전')
    expect(formatRelativeIso('2026-06-07T12:00:00.000Z', base)).toBe('3일 전')
    expect(formatRelativeIso('2025-12-01T12:00:00.000Z', base)).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)
    expect(formatRelativeIso('not-a-date', base)).toBe('')
  })
})

describe('normalizeApiErrorMessage', () => {
  it('API 오류 본문(JSON detail)을 사람이 읽을 메시지로 정리한다', () => {
    const apiError = new Error(
      JSON.stringify({ error: 'BadRequest', detail: '제목을 입력해 주세요.', statusCode: 400 })
    )
    expect(normalizeApiErrorMessage(apiError, '실패')).toBe('제목을 입력해 주세요.')
    expect(normalizeApiErrorMessage(new Error('Failed to fetch'), '실패')).toContain('연결하지')
    expect(normalizeApiErrorMessage(new Error(''), '실패')).toBe('실패')
    expect(normalizeApiErrorMessage('문자열', '실패')).toBe('실패')
  })
})
