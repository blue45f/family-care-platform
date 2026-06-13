import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { communityAttachmentKind, dataUrlByteSize } from '@family-care/shared'

import { JsonCollectionStore } from '../common/json-store'
import { parseWithSchema } from '../common/zod-validation.pipe'
import type { AuthenticatedUser } from '../auth/auth.model'
import {
  communityForbiddenWordInputSchema,
  communityCommentInputSchema,
  communityPostInputSchema,
  communityVisibilityInputSchema,
} from './community.schema'
import type {
  CommunityComment,
  CommunityCommentInput,
  CommunityForbiddenWord,
  CommunityForbiddenWordInput,
  CommunityPost,
  CommunityPostDetail,
  CommunityPostInput,
  CommunityPostSummary,
} from './community.model'

const EXCERPT_LENGTH = 120
const POST_NOT_FOUND_MESSAGE = '게시글을 찾을 수 없습니다.'
const COMMENT_NOT_FOUND_MESSAGE = '댓글을 찾을 수 없습니다.'
const FORBIDDEN_WORD_NOT_FOUND_MESSAGE = '금칙어를 찾을 수 없습니다.'

export type CommunityListFilter = {
  category?: string
  q?: string
}

/** 데모/첫 실행용 시드. 보호자·간병인 커뮤니티의 사용감을 바로 보여 준다. */
const SEED_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGPIn16NFTEMLQkAmPNgQZtNTdQAAAAASUVORK5CYII='

const daysAgoIso = (days: number, hours = 0): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000).toISOString()

const seedPosts = (): CommunityPost[] => [
  {
    id: 1,
    category: '정보공유',
    title: '방문 요양 서비스 신청 절차를 한 장으로 정리했습니다',
    body: '처음 방문 요양을 신청하는 보호자분들이 자주 헤매는 순서를 정리했습니다.\n\n1) 국민건강보험공단에 장기요양인정 신청\n2) 방문 조사 일정 협의\n3) 등급 판정 결과 확인\n4) 센터와 이용 계약 및 첫 방문 일정 잡기\n\n첨부한 안내 이미지는 센터 상담 때 받은 자료를 요약한 것입니다. 등급 판정까지 보통 30일 정도 걸리니 서류는 미리 준비해 두세요.',
    authorId: 1,
    authorName: '데모 관리자',
    createdAt: daysAgoIso(6, 3),
    hidden: false,
    attachments: [
      {
        id: 1,
        name: 'service-guide.png',
        mimeType: 'image/png',
        kind: 'image',
        size: dataUrlByteSize(SEED_IMAGE_DATA_URL),
        dataUrl: SEED_IMAGE_DATA_URL,
      },
    ],
  },
  {
    id: 2,
    category: '질문',
    title: '야간 간병 때 투약 시간을 어떻게 관리하시나요?',
    body: '어머니가 밤 10시와 새벽 2시에 약을 드셔야 하는데, 간병인 교대 시간과 겹쳐 누락될까 걱정입니다. 다른 보호자분들은 야간 투약 시간을 어떻게 챙기시는지 궁금합니다. 알림 앱을 쓰시는지, 간병일지에 따로 표시하시는지 경험을 나눠 주세요.',
    authorId: 2,
    authorName: '김보호',
    createdAt: daysAgoIso(3, 5),
    hidden: false,
    attachments: [],
  },
  {
    id: 3,
    category: '간병후기',
    title: '치매 어르신 3개월 재가 간병 후기 (식사 거부 대처 포함)',
    body: '석 달 동안 치매 초기 어르신을 돌보면서 배운 것들을 남깁니다.\n\n가장 힘들었던 건 식사 거부였는데, 식사 시간을 항상 같은 자리·같은 그릇으로 고정하니 거부가 눈에 띄게 줄었습니다. 좋아하시던 옛날 노래를 틀어 두는 것도 도움이 됐어요. 같은 상황을 겪는 분들께 작은 참고가 되길 바랍니다.',
    authorId: 3,
    authorName: '박간병',
    createdAt: daysAgoIso(1, 2),
    hidden: false,
    attachments: [],
  },
]

const seedComments = (): CommunityComment[] => [
  {
    id: 1,
    postId: 2,
    parentId: null,
    authorId: 3,
    authorName: '박간병',
    body: '저는 간병일지 맨 위에 투약 시간을 크게 적어 두고, 교대할 때 구두로 한 번 더 확인합니다. 인수인계 때 빠뜨리지 않는 게 제일 중요하더라고요.',
    createdAt: daysAgoIso(3, 1),
    deleted: false,
  },
  {
    id: 2,
    postId: 2,
    parentId: 1,
    authorId: 2,
    authorName: '김보호',
    body: '인수인계 때 구두 확인, 바로 적용해 보겠습니다. 감사합니다!',
    createdAt: daysAgoIso(2, 20),
    deleted: false,
  },
  {
    id: 3,
    postId: 2,
    parentId: null,
    authorId: 4,
    authorName: '이도움',
    body: '',
    createdAt: daysAgoIso(2, 8),
    deleted: true,
  },
  {
    id: 4,
    postId: 3,
    parentId: null,
    authorId: 2,
    authorName: '김보호',
    body: '같은 자리·같은 그릇 고정, 저희도 시도해 보겠습니다. 따뜻한 후기 감사합니다.',
    createdAt: daysAgoIso(0, 6),
    deleted: false,
  },
]

@Injectable()
export class CommunityService {
  private readonly postStore = new JsonCollectionStore<CommunityPost>(
    'community-posts.json',
    () => ({ items: seedPosts(), seq: seedPosts().length + 1 })
  )
  private readonly commentStore = new JsonCollectionStore<CommunityComment>(
    'community-comments.json',
    () => ({ items: seedComments(), seq: seedComments().length + 1 })
  )
  private readonly forbiddenWordStore = new JsonCollectionStore<CommunityForbiddenWord>(
    'community-forbidden-words.json',
    () => ({ items: [], seq: 1 })
  )
  private postState = this.postStore.load()
  private commentState = this.commentStore.load()
  private forbiddenWordState = this.forbiddenWordStore.load()

  private isAdmin(actor: AuthenticatedUser | undefined): boolean {
    return actor?.role === 'admin'
  }

  private findPost(postId: number): CommunityPost | undefined {
    return this.postState.items.find((post) => post.id === postId)
  }

  private normalizeForbiddenTerm(term: string): string {
    return term.trim().toLowerCase()
  }

  private assertAllowedCommunityText(...values: string[]): void {
    const haystack = values.join('\n').toLowerCase()
    const matched = this.forbiddenWordState.items.find((word) => {
      const term = this.normalizeForbiddenTerm(word.term)
      return term.length > 0 && haystack.includes(term)
    })
    if (matched) {
      throw new ForbiddenException('금칙어가 포함되어 등록할 수 없습니다.')
    }
  }

  /** 일반 사용자에게 보이는 글만 통과시키고, 숨김 글은 어드민에게만 노출한다. */
  private findVisiblePost(postId: number, actor: AuthenticatedUser | undefined): CommunityPost {
    const post = this.findPost(postId)
    if (!post || (post.hidden && !this.isAdmin(actor))) {
      throw new NotFoundException(POST_NOT_FOUND_MESSAGE)
    }
    return post
  }

  private commentsOf(postId: number): CommunityComment[] {
    return this.commentState.items
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
  }

  private visibleCommentCount(postId: number): number {
    return this.commentState.items.filter(
      (comment) => comment.postId === postId && !comment.deleted
    ).length
  }

  private toSummary(post: CommunityPost): CommunityPostSummary {
    const { body, attachments, ...rest } = post
    const flattened = body.replace(/\s+/g, ' ').trim()
    return {
      ...rest,
      excerpt:
        flattened.length > EXCERPT_LENGTH ? `${flattened.slice(0, EXCERPT_LENGTH)}…` : flattened,
      attachmentCount: attachments.length,
      commentCount: this.visibleCommentCount(post.id),
    }
  }

  /** GET /api/community/posts — 검색(q: 제목/본문/작성자)·카테고리 필터, 최신순. */
  listPosts(
    actor: AuthenticatedUser | undefined,
    filter: CommunityListFilter = {}
  ): CommunityPostSummary[] {
    const query = filter.q?.trim().toLowerCase() ?? ''
    const category = filter.category?.trim() ?? ''

    return this.postState.items
      .filter((post) => !post.hidden || this.isAdmin(actor))
      .filter((post) => !category || post.category === category)
      .filter((post) => {
        if (!query) {
          return true
        }
        return [post.title, post.body, post.authorName].some((text) =>
          text.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      .map((post) => this.toSummary(post))
  }

  /** GET /api/community/posts/:id — 본문 + 첨부 + 댓글(오래된순). */
  getPost(postId: number, actor: AuthenticatedUser | undefined): CommunityPostDetail {
    const post = this.findVisiblePost(postId, actor)
    return { ...post, comments: this.commentsOf(post.id) }
  }

  /** POST /api/community/posts — 글 작성(첨부 검증 포함). */
  createPost(input: CommunityPostInput, actor: AuthenticatedUser): CommunityPostDetail {
    const parsed = parseWithSchema(communityPostInputSchema, input)
    this.assertAllowedCommunityText(parsed.title, parsed.body)

    const next: CommunityPost = {
      id: this.postState.seq!,
      category: parsed.category,
      title: parsed.title,
      body: parsed.body,
      authorId: actor.id,
      authorName: this.displayName(actor),
      createdAt: new Date().toISOString(),
      hidden: false,
      attachments: parsed.attachments.map((attachment, index) => ({
        id: index + 1,
        name: attachment.name,
        mimeType: attachment.mimeType,
        // schema가 mimeType allowlist를 보장하므로 kind는 항상 결정된다.
        kind: communityAttachmentKind(attachment.mimeType) ?? 'image',
        size: dataUrlByteSize(attachment.dataUrl),
        dataUrl: attachment.dataUrl,
      })),
    }

    this.postState.items.push(next)
    this.postState.seq = this.postState.seq! + 1
    this.postStore.save(this.postState)
    return { ...next, comments: [] }
  }

  /** POST /api/community/posts/:id/comments — 댓글/1단 답글 작성. */
  addComment(
    postId: number,
    input: CommunityCommentInput,
    actor: AuthenticatedUser
  ): CommunityComment {
    const parsed = parseWithSchema(communityCommentInputSchema, input)
    this.assertAllowedCommunityText(parsed.body)
    const post = this.findVisiblePost(postId, actor)

    const parentId = parsed.parentId ?? null
    if (parentId !== null) {
      const parent = this.commentState.items.find((comment) => comment.id === parentId)
      if (!parent || parent.postId !== post.id) {
        throw new NotFoundException('답글을 달 댓글을 찾을 수 없습니다.')
      }
      if (parent.parentId !== null) {
        throw new ForbiddenException('답글에는 다시 답글을 달 수 없습니다.')
      }
      if (parent.deleted) {
        throw new ForbiddenException('삭제된 댓글에는 답글을 달 수 없습니다.')
      }
    }

    const next: CommunityComment = {
      id: this.commentState.seq!,
      postId: post.id,
      parentId,
      authorId: actor.id,
      authorName: this.displayName(actor),
      body: parsed.body,
      createdAt: new Date().toISOString(),
      deleted: false,
    }

    this.commentState.items.push(next)
    this.commentState.seq = this.commentState.seq! + 1
    this.commentStore.save(this.commentState)
    return next
  }

  /**
   * POST /api/community/comments/:id/delete — 소프트 삭제.
   * 본문을 비우고 deleted 플래그만 세워 "삭제된 댓글" placeholder로 스레드를 보존한다.
   */
  deleteComment(commentId: number, actor: AuthenticatedUser): CommunityComment {
    const comment = this.commentState.items.find((candidate) => candidate.id === commentId)
    if (!comment) {
      throw new NotFoundException(COMMENT_NOT_FOUND_MESSAGE)
    }
    if (comment.authorId !== actor.id && !this.isAdmin(actor)) {
      throw new ForbiddenException('본인이 작성한 댓글만 삭제할 수 있습니다.')
    }
    if (!comment.deleted) {
      comment.deleted = true
      comment.body = ''
      this.commentStore.save(this.commentState)
    }
    return comment
  }

  /** POST /api/community/posts/:id/delete — 글 완전 삭제(댓글도 함께 정리). */
  deletePost(postId: number, actor: AuthenticatedUser): { deleted: true } {
    const post = this.findVisiblePost(postId, actor)
    if (post.authorId !== actor.id && !this.isAdmin(actor)) {
      throw new ForbiddenException('본인이 작성한 글만 삭제할 수 있습니다.')
    }

    this.postState.items = this.postState.items.filter((candidate) => candidate.id !== post.id)
    this.postStore.save(this.postState)

    const before = this.commentState.items.length
    this.commentState.items = this.commentState.items.filter(
      (comment) => comment.postId !== post.id
    )
    if (this.commentState.items.length !== before) {
      this.commentStore.save(this.commentState)
    }
    return { deleted: true }
  }

  /** POST /api/community/posts/:postId/attachments/:attachmentId/delete — 첨부 제거. */
  deleteAttachment(
    postId: number,
    attachmentId: number,
    actor: AuthenticatedUser
  ): CommunityPostDetail {
    const post = this.findVisiblePost(postId, actor)
    if (post.authorId !== actor.id && !this.isAdmin(actor)) {
      throw new ForbiddenException('본인이 올린 첨부만 삭제할 수 있습니다.')
    }

    const exists = post.attachments.some((attachment) => attachment.id === attachmentId)
    if (!exists) {
      throw new NotFoundException('첨부 파일을 찾을 수 없습니다.')
    }

    post.attachments = post.attachments.filter((attachment) => attachment.id !== attachmentId)
    this.postStore.save(this.postState)
    return { ...post, comments: this.commentsOf(post.id) }
  }

  /** PATCH /api/community/posts/:id/visibility — 어드민 숨김/복구. */
  setVisibility(postId: number, input: unknown, actor: AuthenticatedUser): CommunityPostSummary {
    if (!this.isAdmin(actor)) {
      throw new ForbiddenException('관리자 권한이 필요합니다.')
    }
    const parsed = parseWithSchema(communityVisibilityInputSchema, input)
    const post = this.findPost(postId)
    if (!post) {
      throw new NotFoundException(POST_NOT_FOUND_MESSAGE)
    }

    post.hidden = parsed.hidden
    this.postStore.save(this.postState)
    return this.toSummary(post)
  }

  /** GET /api/admin/community/forbidden-words — 관리자 금칙어 목록. */
  listForbiddenWords(): CommunityForbiddenWord[] {
    return [...this.forbiddenWordState.items].sort(
      (a, b) => a.term.localeCompare(b.term, 'ko') || a.id - b.id
    )
  }

  /** POST /api/admin/community/forbidden-words — 금칙어 추가. */
  createForbiddenWord(input: CommunityForbiddenWordInput): CommunityForbiddenWord {
    const parsed = parseWithSchema(communityForbiddenWordInputSchema, input)
    this.assertUniqueForbiddenWord(parsed.term)

    const now = new Date().toISOString()
    const next: CommunityForbiddenWord = {
      id: this.forbiddenWordState.seq!,
      term: parsed.term,
      createdAt: now,
      updatedAt: now,
    }
    this.forbiddenWordState.items.push(next)
    this.forbiddenWordState.seq = this.forbiddenWordState.seq! + 1
    this.forbiddenWordStore.save(this.forbiddenWordState)
    return { ...next }
  }

  /** PATCH /api/admin/community/forbidden-words/:id — 금칙어 수정. */
  updateForbiddenWord(id: number, input: CommunityForbiddenWordInput): CommunityForbiddenWord {
    const parsed = parseWithSchema(communityForbiddenWordInputSchema, input)
    const target = this.forbiddenWordState.items.find((word) => word.id === id)
    if (!target) {
      throw new NotFoundException(FORBIDDEN_WORD_NOT_FOUND_MESSAGE)
    }
    this.assertUniqueForbiddenWord(parsed.term, id)

    target.term = parsed.term
    target.updatedAt = new Date().toISOString()
    this.forbiddenWordStore.save(this.forbiddenWordState)
    return { ...target }
  }

  /** POST /api/admin/community/forbidden-words/:id/delete — 금칙어 삭제. */
  deleteForbiddenWord(id: number): { deleted: true } {
    const before = this.forbiddenWordState.items.length
    this.forbiddenWordState.items = this.forbiddenWordState.items.filter((word) => word.id !== id)
    if (this.forbiddenWordState.items.length === before) {
      throw new NotFoundException(FORBIDDEN_WORD_NOT_FOUND_MESSAGE)
    }
    this.forbiddenWordStore.save(this.forbiddenWordState)
    return { deleted: true }
  }

  private assertUniqueForbiddenWord(term: string, exceptId?: number): void {
    const normalized = this.normalizeForbiddenTerm(term)
    const exists = this.forbiddenWordState.items.some(
      (word) => word.id !== exceptId && this.normalizeForbiddenTerm(word.term) === normalized
    )
    if (exists) {
      throw new ConflictException('이미 등록된 금칙어입니다.')
    }
  }

  // AuthGuard가 스토어에서 재조회한 이름을 우선 쓰고, 비어 있으면 이메일 로컬 파트로 폴백한다.
  private displayName(actor: AuthenticatedUser): string {
    return actor.name.trim() || actor.email.split('@')[0] || '이용자'
  }
}
