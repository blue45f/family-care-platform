/* =========================================================================
   TermsDesk 공개 정책 문서 데이터 소스.

   약관/개인정보 처리방침을 외부 리다이렉트 대신 내부 페이지에서 직접
   렌더링하기 위해, TermsDesk의 무인증 공개 API(JSON)를 읽는다. 본문은
   플레인 텍스트(`제N조 …` 헤딩) 또는 마크다운일 수 있어 두 형식을 모두
   다루는 최소 블록 파서를 함께 제공한다. HTML 변형(/html)은 sanitize
   의존성 없이는 쓰지 않는다 — 텍스트 기반 렌더가 단일 경로다.
   ========================================================================= */

export const TERMSDESK_BASE = 'https://termsdesk.vercel.app'
export const TERMSDESK_ORG_SLUG = 'family-care-platform'

export type PolicySlug = 'terms-of-service' | 'privacy-policy'

export type TermsdeskPolicy = {
  policySlug: string
  name: string
  versionLabel: string
  /** 게시본 무결성 해시(전체값). 표기는 shortContentHash로 축약한다. */
  contentHash: string
  body: string
  effectiveAt: string | null
  publishedAt: string | null
  changeSummary: string | null
}

/** 사람이 읽는 TermsDesk 원문 페이지(폴백 카드/원문 링크용). */
export const policyDocumentUrl = (slug: PolicySlug) =>
  `${TERMSDESK_BASE}/p/${TERMSDESK_ORG_SLUG}/${slug}`

const policyApiUrl = (slug: PolicySlug) =>
  `${TERMSDESK_BASE}/api/public/${TERMSDESK_ORG_SLUG}/policies/${slug}`

const asOptionalString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null

/**
 * TermsDesk 공개 JSON 엔드포인트에서 정책 문서를 읽는다.
 * 응답 형식이 어긋나면(스키마 드리프트) 조용히 깨진 화면을 그리는 대신
 * 던져서 폴백 카드로 떨어지게 한다.
 */
export async function fetchTermsdeskPolicy(slug: PolicySlug): Promise<TermsdeskPolicy> {
  const response = await fetch(policyApiUrl(slug), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`정책 문서를 불러오지 못했습니다. 상태: ${response.status}`)
  }

  const payload = (await response.json()) as Record<string, unknown>
  const { name, versionLabel, contentHash, body } = payload

  if (
    typeof name !== 'string' ||
    typeof versionLabel !== 'string' ||
    typeof contentHash !== 'string' ||
    typeof body !== 'string' ||
    body.trim().length === 0
  ) {
    throw new Error('정책 문서 응답 형식이 올바르지 않습니다.')
  }

  return {
    policySlug: typeof payload.policySlug === 'string' ? payload.policySlug : slug,
    name,
    versionLabel,
    contentHash,
    body,
    effectiveAt: asOptionalString(payload.effectiveAt),
    publishedAt: asOptionalString(payload.publishedAt),
    changeSummary: asOptionalString(payload.changeSummary),
  }
}

/* ------------------------------------------------------------------ 본문 파서 */

export type PolicyBlock =
  | { kind: 'heading'; level: 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }

/** `제1조 (목적)` 같은 한국 법령식 조항 제목(한 줄 전체일 때만). */
const ARTICLE_HEADING_PATTERN = /^제\s*\d+\s*조\s*(\([^)]*\))?$/
const MARKDOWN_HEADING_PATTERN = /^(#{1,6})\s+(.*)$/
const UNORDERED_ITEM_PATTERN = /^[-*•]\s+(.*)$/
const ORDERED_ITEM_PATTERN = /^(\d+)[.)]\s+(.*)$/
const HORIZONTAL_RULE_PATTERN = /^(-{3,}|\*{3,}|_{3,})$/

const markdownHeadingLevel = (hashes: string): 2 | 3 | 4 => {
  if (hashes.length <= 1) return 2
  if (hashes.length === 2) return 3
  return 4
}

/**
 * 정책 본문을 화면 블록(heading/paragraph/list)으로 파싱한다.
 * 빈 줄이 블록 경계이고, 같은 문단 안의 줄바꿈은 보존한다(렌더 측에서
 * `white-space: pre-line`으로 표현).
 */
export function parsePolicyBody(body: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = []
  let paragraphLines: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraphLines.join('\n') })
      paragraphLines = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push({ kind: 'list', ordered: list.ordered, items: list.items })
      list = null
    }
  }

  for (const rawLine of body.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim()

    if (line.length === 0) {
      flushParagraph()
      flushList()
      continue
    }

    const markdownHeading = line.match(MARKDOWN_HEADING_PATTERN)
    if (markdownHeading) {
      flushParagraph()
      flushList()
      blocks.push({
        kind: 'heading',
        level: markdownHeadingLevel(markdownHeading[1]),
        text: markdownHeading[2].trim(),
      })
      continue
    }

    if (ARTICLE_HEADING_PATTERN.test(line)) {
      flushParagraph()
      flushList()
      blocks.push({ kind: 'heading', level: 2, text: line })
      continue
    }

    if (HORIZONTAL_RULE_PATTERN.test(line)) {
      flushParagraph()
      flushList()
      continue
    }

    const unorderedItem = line.match(UNORDERED_ITEM_PATTERN)
    if (unorderedItem) {
      flushParagraph()
      if (list?.ordered) flushList()
      list ??= { ordered: false, items: [] }
      list.items.push(unorderedItem[1])
      continue
    }

    const orderedItem = line.match(ORDERED_ITEM_PATTERN)
    if (orderedItem) {
      flushParagraph()
      if (list && !list.ordered) flushList()
      list ??= { ordered: true, items: [] }
      list.items.push(orderedItem[2])
      continue
    }

    flushList()
    paragraphLines.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

/* ----------------------------------------------------------- 신뢰 표면 헬퍼 */

/** 무결성 해시 축약 표기(앞 12자). 원문 검증은 TermsDesk /verify가 담당. */
export const shortContentHash = (contentHash: string) => contentHash.slice(0, 12)

/**
 * ISO 일시 → `YYYY년 M월 D일`. 타임존 영향 없이 날짜 부분만 읽는다
 * (정책 시행일은 달력 날짜가 의미 단위).
 */
export const formatPolicyDate = (iso: string | null): string | null => {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const [, year, month, day] = match
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}
