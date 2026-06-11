import type { CommunityComment } from '../../types'

/*
 * 커뮤니티 화면의 순수 뷰 헬퍼. DOM/네트워크 없이 동작해 node 환경에서 테스트한다.
 */

export type CommentThread = {
  comment: CommunityComment
  replies: CommunityComment[]
}

/**
 * 평탄한 댓글 배열을 1단 스레드(최상위 + 답글 목록)로 묶는다.
 * - 부모가 사라진 답글(고아)은 최상위로 승격해 데이터가 손실돼도 화면에서 잃지 않는다.
 * - 입력 순서(서버가 오래된순 정렬)를 그대로 보존한다.
 */
export const buildCommentThreads = (comments: CommunityComment[]): CommentThread[] => {
  const topLevel = comments.filter((comment) => comment.parentId === null)
  const knownIds = new Set(topLevel.map((comment) => comment.id))
  const threads: CommentThread[] = topLevel.map((comment) => ({ comment, replies: [] }))
  const byId = new Map(threads.map((thread) => [thread.comment.id, thread]))

  for (const comment of comments) {
    if (comment.parentId === null) {
      continue
    }
    const parent =
      comment.parentId !== null && knownIds.has(comment.parentId)
        ? byId.get(comment.parentId)
        : undefined
    if (parent) {
      parent.replies.push(comment)
    } else {
      const orphan: CommentThread = { comment, replies: [] }
      threads.push(orphan)
      byId.set(comment.id, orphan)
      knownIds.add(comment.id)
    }
  }
  return threads
}

/** 화면에 노출되는 댓글 수(삭제 placeholder 제외). */
export const visibleCommentCount = (comments: CommunityComment[]): number =>
  comments.filter((comment) => !comment.deleted).length

/** ISO 시각 → "방금 전 / n분 전 / n시간 전 / n일 전 / yyyy.mm.dd" 상대 표기. */
export const formatRelativeIso = (iso: string, baseline: number = Date.now()): string => {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) {
    return ''
  }
  const diffMs = Math.max(0, baseline - time)
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) {
    return '방금 전'
  }
  if (minutes < 60) {
    return `${minutes}분 전`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}시간 전`
  }
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days}일 전`
  }
  const date = new Date(time)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}

/** API 오류 텍스트(JSON detail/message 우선)를 사용자 메시지로 정리한다. */
export const normalizeApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof Error) || !error.message) {
    return fallback
  }
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return 'API 서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
  try {
    const parsed = JSON.parse(error.message) as { detail?: string; message?: string | string[] }
    if (typeof parsed.detail === 'string' && parsed.detail) {
      return parsed.detail
    }
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(' ') || fallback
    }
    if (typeof parsed.message === 'string' && parsed.message) {
      return parsed.message
    }
  } catch {
    // JSON이 아니면 원문 그대로(이미 사람이 읽을 메시지일 수 있다).
  }
  return error.message.length > 160 ? fallback : error.message
}
