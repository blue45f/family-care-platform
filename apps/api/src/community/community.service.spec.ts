import { beforeEach, describe, expect, it } from 'vitest'

import { CommunityService } from './community.service'
import type { AuthenticatedUser } from '../auth/auth.model'

// 테스트 환경(VITEST)에서는 JsonCollectionStore가 인메모리로만 동작해 매 인스턴스가 seed에서 출발한다.
const writer: AuthenticatedUser = {
  id: 10,
  email: 'writer@example.com',
  name: '글쓴이',
  role: 'operator',
}
const other: AuthenticatedUser = {
  id: 11,
  email: 'other@example.com',
  name: '다른이',
  role: 'operator',
}
const admin: AuthenticatedUser = {
  id: 1,
  email: 'admin@example.com',
  name: '관리자',
  role: 'admin',
}

const pngDataUrl = (bytes: number): string =>
  `data:image/png;base64,${Buffer.alloc(bytes, 7).toString('base64')}`

const validPost = {
  category: '질문' as const,
  title: '야간 투약 시간 관리 질문',
  body: '교대 시간과 겹치는 투약을 어떻게 관리하시나요?',
}

describe('CommunityService', () => {
  let service: CommunityService

  beforeEach(() => {
    service = new CommunityService()
  })

  it('시드 게시글을 최신순 요약으로 반환하고 본문은 excerpt로 줄인다', () => {
    const posts = service.listPosts(undefined)
    expect(posts.length).toBeGreaterThanOrEqual(3)
    expect(posts[0].createdAt >= posts[posts.length - 1].createdAt).toBe(true)
    for (const post of posts) {
      expect(post).not.toHaveProperty('body')
      expect(post).not.toHaveProperty('attachments')
      expect(typeof post.excerpt).toBe('string')
    }
  })

  it('검색(q)은 제목/본문/작성자를 대소문자 무관하게 거르고, 카테고리 필터와 결합된다', () => {
    expect(service.listPosts(undefined, { q: '투약' }).length).toBeGreaterThanOrEqual(1)
    expect(service.listPosts(undefined, { q: '투약', category: '간병후기' })).toHaveLength(0)
    expect(service.listPosts(undefined, { category: '간병후기' })).toHaveLength(1)
    expect(service.listPosts(undefined, { q: '없는검색어구나야' })).toHaveLength(0)
  })

  it('글 작성은 작성자 표시명을 부여하고 상세 조회에 본문/첨부/댓글을 포함한다', () => {
    const created = service.createPost(
      {
        ...validPost,
        attachments: [{ name: 'a.png', mimeType: 'image/png', dataUrl: pngDataUrl(10) }],
      },
      writer,
    )
    expect(created.authorName).toBe('글쓴이')
    expect(created.attachments[0]).toMatchObject({ id: 1, kind: 'image', size: 10 })

    const detail = service.getPost(created.id, undefined)
    expect(detail.body).toBe(validPost.body)
    expect(detail.comments).toEqual([])
  })

  it('첨부는 allowlist(이미지/PDF)·2MB 캡·최대 4개를 강제한다', () => {
    expect(() =>
      service.createPost(
        {
          ...validPost,
          attachments: [
            { name: 'x.gif', mimeType: 'image/gif', dataUrl: 'data:image/gif;base64,aGk=' },
          ],
        } as never,
        writer,
      ),
    ).toThrow('허용되지 않는 파일 형식입니다. (이미지 jpeg/png/webp 또는 PDF)')

    expect(() =>
      service.createPost(
        {
          ...validPost,
          attachments: [
            { name: 'big.png', mimeType: 'image/png', dataUrl: pngDataUrl(2 * 1024 * 1024 + 1) },
          ],
        },
        writer,
      ),
    ).toThrow('파일은 2MB 이하만 첨부할 수 있습니다.')

    expect(() =>
      service.createPost(
        {
          ...validPost,
          attachments: Array.from({ length: 5 }, (_, i) => ({
            name: `a${i}.png`,
            mimeType: 'image/png' as const,
            dataUrl: pngDataUrl(8),
          })),
        },
        writer,
      ),
    ).toThrow('첨부는 최대 4개까지 가능합니다.')

    // mime과 data URL 프리픽스가 어긋나면 거부한다(타입 위장 방지).
    expect(() =>
      service.createPost(
        {
          ...validPost,
          attachments: [
            { name: 'x.png', mimeType: 'image/png', dataUrl: 'data:application/pdf;base64,aGk=' },
          ],
        },
        writer,
      ),
    ).toThrow('파일 데이터가 올바르지 않습니다.')
  })

  it('댓글과 1단 답글을 허용하고, 답글의 답글은 거부한다', () => {
    const post = service.createPost(validPost, writer)
    const comment = service.addComment(post.id, { body: '첫 댓글' }, other)
    const reply = service.addComment(post.id, { body: '답글', parentId: comment.id }, writer)
    expect(reply.parentId).toBe(comment.id)

    expect(() =>
      service.addComment(post.id, { body: '답답글', parentId: reply.id }, other),
    ).toThrow('답글에는 다시 답글을 달 수 없습니다.')
    expect(() => service.addComment(post.id, { body: 'x', parentId: 9999 }, other)).toThrow(
      '답글을 달 댓글을 찾을 수 없습니다.',
    )
  })

  it('댓글 삭제는 소프트 삭제로 placeholder를 남기고, 본인/관리자만 가능하다', () => {
    const post = service.createPost(validPost, writer)
    const comment = service.addComment(post.id, { body: '지울 댓글' }, other)
    const reply = service.addComment(post.id, { body: '답글 유지' }, writer)

    expect(() => service.deleteComment(comment.id, writer)).toThrow(
      '본인이 작성한 댓글만 삭제할 수 있습니다.',
    )

    const deleted = service.deleteComment(comment.id, other)
    expect(deleted.deleted).toBe(true)
    expect(deleted.body).toBe('')

    // 스레드는 보존된다(삭제 placeholder + 살아있는 댓글).
    const detail = service.getPost(post.id, undefined)
    expect(detail.comments.map((c) => c.id)).toEqual([comment.id, reply.id])
    // 삭제된 댓글에는 답글을 달 수 없다.
    expect(() => service.addComment(post.id, { body: 'x', parentId: comment.id }, writer)).toThrow(
      '삭제된 댓글에는 답글을 달 수 없습니다.',
    )
    // 노출 댓글 수 집계에서는 제외된다.
    const summary = service.listPosts(undefined).find((p) => p.id === post.id)
    expect(summary?.commentCount).toBe(1)

    // 관리자는 남의 댓글도 삭제(숨김 처리)할 수 있다.
    expect(service.deleteComment(reply.id, admin).deleted).toBe(true)
  })

  it('글 삭제는 본인/관리자만 가능하고 댓글도 함께 정리한다', () => {
    const post = service.createPost(validPost, writer)
    service.addComment(post.id, { body: '댓글' }, other)

    expect(() => service.deletePost(post.id, other)).toThrow(
      '본인이 작성한 글만 삭제할 수 있습니다.',
    )
    expect(service.deletePost(post.id, writer)).toEqual({ deleted: true })
    expect(() => service.getPost(post.id, undefined)).toThrow('게시글을 찾을 수 없습니다.')
  })

  it('첨부 삭제는 본인/관리자만 가능하다', () => {
    const post = service.createPost(
      {
        ...validPost,
        attachments: [{ name: 'a.png', mimeType: 'image/png', dataUrl: pngDataUrl(9) }],
      },
      writer,
    )
    expect(() => service.deleteAttachment(post.id, 1, other)).toThrow(
      '본인이 올린 첨부만 삭제할 수 있습니다.',
    )
    const updated = service.deleteAttachment(post.id, 1, admin)
    expect(updated.attachments).toHaveLength(0)
    expect(() => service.deleteAttachment(post.id, 1, writer)).toThrow(
      '첨부 파일을 찾을 수 없습니다.',
    )
  })

  it('숨김 처리는 관리자 전용이고, 숨긴 글은 일반 사용자 목록/상세에서 사라진다', () => {
    const post = service.createPost(validPost, writer)
    expect(() => service.setVisibility(post.id, { hidden: true }, writer)).toThrow(
      '관리자 권한이 필요합니다.',
    )

    const hiddenSummary = service.setVisibility(post.id, { hidden: true }, admin)
    expect(hiddenSummary.hidden).toBe(true)

    // 일반 사용자: 목록에서 제외 + 상세 404. 작성자 본인도 동일하다.
    expect(service.listPosts(other).find((p) => p.id === post.id)).toBeUndefined()
    expect(() => service.getPost(post.id, writer)).toThrow('게시글을 찾을 수 없습니다.')

    // 관리자: 목록/상세 모두 접근 가능(복구 동선).
    expect(service.listPosts(admin).find((p) => p.id === post.id)?.hidden).toBe(true)
    expect(service.getPost(post.id, admin).id).toBe(post.id)

    // 복구하면 다시 보인다.
    service.setVisibility(post.id, { hidden: false }, admin)
    expect(service.getPost(post.id, undefined).id).toBe(post.id)
  })

  it('입력 검증: 제목/본문 필수와 길이 한도를 강제한다', () => {
    expect(() => service.createPost({ ...validPost, title: '  ' }, writer)).toThrow(
      '제목을 입력해 주세요.',
    )
    expect(() => service.createPost({ ...validPost, body: 'a'.repeat(4001) }, writer)).toThrow(
      '내용은 4000자 이내여야 합니다.',
    )
    const post = service.createPost(validPost, writer)
    expect(() => service.addComment(post.id, { body: '' }, writer)).toThrow(
      '댓글 내용을 입력해 주세요.',
    )
  })

  it('관리자 금칙어 CRUD를 제공하고 게시글/댓글 등록을 차단한다', () => {
    const created = service.createForbiddenWord({ term: '  금지표현  ' })
    expect(created.term).toBe('금지표현')
    expect(service.listForbiddenWords()).toHaveLength(1)

    expect(() => service.createForbiddenWord({ term: '금지표현' })).toThrow(
      '이미 등록된 금칙어입니다.',
    )
    expect(() => service.createForbiddenWord({ term: '  ' })).toThrow('금칙어를 입력해 주세요.')

    expect(() =>
      service.createPost({ ...validPost, title: '금지표현이 들어간 제목' }, writer),
    ).toThrow('금칙어가 포함되어 등록할 수 없습니다.')

    const post = service.createPost(validPost, writer)
    expect(() => service.addComment(post.id, { body: '댓글에 금지표현 포함' }, other)).toThrow(
      '금칙어가 포함되어 등록할 수 없습니다.',
    )

    const updated = service.updateForbiddenWord(created.id, { term: '다른금칙어' })
    expect(updated.term).toBe('다른금칙어')
    expect(service.deleteForbiddenWord(created.id)).toEqual({ deleted: true })
    expect(
      service.createPost({ ...validPost, body: '다른금칙어가 있어도 삭제 후 허용' }, writer).id,
    ).toBeGreaterThan(0)
    expect(() => service.deleteForbiddenWord(created.id)).toThrow('금칙어를 찾을 수 없습니다.')
  })
})
