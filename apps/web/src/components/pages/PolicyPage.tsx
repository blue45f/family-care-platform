import { useEffect, useState } from 'react'

import { routeDefs, type AppRoute } from '../../routeConfig'
import {
  fetchTermsdeskPolicy,
  formatPolicyDate,
  parsePolicyBody,
  policyDocumentUrl,
  shortContentHash,
  type PolicySlug,
  type TermsdeskPolicy,
} from '../../termsdeskPolicy'
import { Badge, Button, Card, EmptyState, Icon, PageHeader, Skeleton, SkeletonLines } from '../ui'

/* TermsDesk 게시본을 내부에서 렌더링하는 법적 고지 페이지(/terms·/privacy).
   외부 리다이렉트 대신 같은 디자인 토큰 안에서 본문을 보여주고, 하단에
   버전·시행일·무결성 해시(신뢰 표면)와 TermsDesk 원문 링크를 남긴다. */

export type PolicyRoute = Extract<AppRoute, '/terms' | '/privacy'>

const POLICY_SLUG_BY_ROUTE: Record<PolicyRoute, PolicySlug> = {
  '/terms': 'terms-of-service',
  '/privacy': 'privacy-policy',
}

type PolicyPageProps = {
  route: PolicyRoute
  onNavigate: (path: AppRoute) => void
}

type PolicyViewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; policy: TermsdeskPolicy }

/** 로딩 스켈레톤: 조항 제목 + 본문 줄 구조를 흉내 내 레이아웃 점프를 줄인다. */
export const PolicySkeletonCard = () => (
  <Card>
    <div aria-busy="true">
      <p className="sr-only" role="status" aria-live="polite">
        정책 문서를 불러오는 중입니다.
      </p>
      <div className="stack-sm" aria-hidden="true">
        <Skeleton width="34%" height="1.35rem" />
        <SkeletonLines lines={3} />
        <Skeleton width="28%" height="1.35rem" />
        <SkeletonLines lines={4} />
        <Skeleton width="31%" height="1.35rem" />
        <SkeletonLines lines={2} />
      </div>
    </div>
  </Card>
)

type PolicyFallbackCardProps = {
  slug: PolicySlug
  onRetry: () => void
}

/** 로드 실패 폴백: 재시도 + TermsDesk 원문(외부) 링크를 함께 제공한다. */
export const PolicyFallbackCard = ({ slug, onRetry }: PolicyFallbackCardProps) => (
  <Card>
    <EmptyState
      title="정책 문서를 불러오지 못했습니다"
      description="네트워크 상태를 확인하고 다시 시도하거나, TermsDesk 원문 페이지에서 같은 내용을 바로 확인할 수 있습니다."
      action={
        <div className="public-hero-actions">
          <Button onClick={onRetry}>
            <Icon name="refresh" size={16} />
            다시 시도
          </Button>
          <a
            className="btn btn-secondary"
            href={policyDocumentUrl(slug)}
            target="_blank"
            rel="noreferrer"
          >
            TermsDesk 원문 열기
          </a>
        </div>
      }
    />
  </Card>
)

type PolicyArticleProps = {
  slug: PolicySlug
  policy: TermsdeskPolicy
}

/** 게시본 본문 + 하단 신뢰 표면(버전·시행일·해시 축약·원문 링크). */
export const PolicyArticle = ({ slug, policy }: PolicyArticleProps) => {
  const blocks = parsePolicyBody(policy.body)
  const effectiveDate = formatPolicyDate(policy.effectiveAt)

  return (
    <Card as="article" className="legal-card">
      <div className="legal-doc-head">
        <Badge tone="accent" plain>
          {policy.versionLabel}
        </Badge>
        {effectiveDate ? <span>{effectiveDate} 시행</span> : null}
        {policy.changeSummary ? <span>{policy.changeSummary}</span> : null}
      </div>

      <div className="legal-article">
        {blocks.map((block, index) => {
          if (block.kind === 'heading') {
            const HeadingTag = `h${block.level}` as 'h2' | 'h3' | 'h4'
            return <HeadingTag key={index}>{block.text}</HeadingTag>
          }
          if (block.kind === 'list') {
            const ListTag = block.ordered ? 'ol' : 'ul'
            return (
              <ListTag key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ListTag>
            )
          }
          return <p key={index}>{block.text}</p>
        })}
      </div>

      <footer className="legal-trust" aria-label="문서 신뢰 정보">
        <ul className="legal-trust-list">
          <li>
            <span>버전</span>
            <strong>{policy.versionLabel}</strong>
          </li>
          <li>
            <span>시행일</span>
            <strong>{effectiveDate ?? '게시본 기준'}</strong>
          </li>
          <li>
            <span>무결성 해시</span>
            <code title={policy.contentHash}>{shortContentHash(policy.contentHash)}</code>
          </li>
        </ul>
        <a className="card-link" href={policyDocumentUrl(slug)} target="_blank" rel="noreferrer">
          TermsDesk 원문에서 확인
        </a>
      </footer>
    </Card>
  )
}

export const PolicyPage = ({ route, onNavigate }: PolicyPageProps) => {
  const def = routeDefs[route]
  const slug = POLICY_SLUG_BY_ROUTE[route]
  const [attempt, setAttempt] = useState(0)
  const [view, setView] = useState<PolicyViewState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setView({ status: 'loading' })

    fetchTermsdeskPolicy(slug)
      .then((policy) => {
        if (!cancelled) setView({ status: 'ready', policy })
      })
      .catch(() => {
        if (!cancelled) setView({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [slug, attempt])

  return (
    <div className="stack legal-page">
      <PageHeader
        eyebrow={def.eyebrow}
        title={def.title}
        actions={
          <Button variant="secondary" onClick={() => onNavigate('/')}>
            홈으로
          </Button>
        }
      />

      {view.status === 'loading' ? <PolicySkeletonCard /> : null}
      {view.status === 'error' ? (
        <PolicyFallbackCard slug={slug} onRetry={() => setAttempt((count) => count + 1)} />
      ) : null}
      {view.status === 'ready' ? <PolicyArticle slug={slug} policy={view.policy} /> : null}
    </div>
  )
}
