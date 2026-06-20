import { useId, useMemo, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
  Select,
  Skeleton,
  SkeletonLines,
  Stat,
  Table,
  Textarea,
  type BadgeTone,
  type TableColumn,
} from '../ui'

import './DesignSystemPage.css'

/* =========================================================================
   DesignSystemPage — living style guide at /design.

   Showcases THIS project's real tokens (styles.css :root) and real components
   (components/ui). Color/scale values are read live via getComputedStyle so the
   page always reflects the source of truth rather than hardcoded duplicates.

   Registered as a standalone public route in main.tsx (above the auth gate and
   outside the typed AppRoute system), so it never perturbs route specs and is
   reachable without logging in.
   ========================================================================= */

type ColorSwatch = {
  /** CSS custom property name, e.g. "--accent". */
  token: string
  /** Human label. */
  name: string
}

type ColorGroup = {
  title: string
  description: string
  swatches: ColorSwatch[]
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    title: '브랜드 · 액센트',
    description:
      'sage(돌봄·신뢰) 한 가지 액센트가 활성 내비·주요 액션·상태 표시 등 약 10% 픽셀에만 쓰입니다.',
    swatches: [
      { token: '--accent', name: 'Accent (sage-500)' },
      { token: '--accent-hover', name: 'Accent hover' },
      { token: '--accent-active', name: 'Accent active' },
      { token: '--accent-soft', name: 'Accent soft' },
      { token: '--accent-soft-fg', name: 'Accent soft fg' },
    ],
  },
  {
    title: '표면 · 배경',
    description: 'hue ~80의 따뜻한 sand 계열. 순백/순흑 대신 미세하게 톤을 입힌 중립색입니다.',
    swatches: [
      { token: '--bg-app', name: 'App 배경' },
      { token: '--bg-surface', name: 'Surface' },
      { token: '--bg-surface-raised', name: 'Surface raised' },
      { token: '--bg-sunken', name: 'Sunken' },
      { token: '--bg-hover', name: 'Hover' },
    ],
  },
  {
    title: '텍스트 · 경계',
    description: '본문 대비 기준(≥4.5:1)을 충족하도록 단계화한 전경색과 경계선 토큰입니다.',
    swatches: [
      { token: '--fg-strong', name: 'Text strong' },
      { token: '--fg-default', name: 'Text default' },
      { token: '--fg-muted', name: 'Text muted' },
      { token: '--fg-subtle', name: 'Text subtle' },
      { token: '--border', name: 'Border' },
      { token: '--border-strong', name: 'Border strong' },
    ],
  },
  {
    title: '상태 (시맨틱)',
    description: 'success/warn/danger/info 각각 배경+전경 쌍으로 정의해 대비를 보장합니다.',
    swatches: [
      { token: '--c-success-bg', name: 'Success bg' },
      { token: '--c-success-fg', name: 'Success fg' },
      { token: '--c-warn-bg', name: 'Warn bg' },
      { token: '--c-warn-fg', name: 'Warn fg' },
      { token: '--c-danger-bg', name: 'Danger bg' },
      { token: '--c-danger-fg', name: 'Danger fg' },
      { token: '--c-info-bg', name: 'Info bg' },
      { token: '--c-info-fg', name: 'Info fg' },
    ],
  },
]

const TYPE_SCALE: { token: string; label: string }[] = [
  { token: '--text-3xl', label: 'text-3xl · 39px' },
  { token: '--text-2xl', label: 'text-2xl · 31px' },
  { token: '--text-xl', label: 'text-xl · 25px' },
  { token: '--text-lg', label: 'text-lg · 20px' },
  { token: '--text-base', label: 'text-base · 16px' },
  { token: '--text-sm', label: 'text-sm · 14px' },
  { token: '--text-xs', label: 'text-xs · 12.8px' },
  { token: '--text-2xs', label: 'text-2xs · 11px' },
]

const SPACING_TOKENS = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-8',
  '--space-10',
  '--space-12',
  '--space-16',
]

const RADIUS_TOKENS = [
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-full',
]

const SHADOW_TOKENS = ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg']

const MOTION_TOKENS = ['--dur-fast', '--dur-mid', '--dur-slow', '--ease-out', '--ease-out-soft']

const BADGE_TONES: BadgeTone[] = ['neutral', 'success', 'warn', 'danger', 'info', 'accent']

const TOC_SECTIONS = [
  { id: 'foundations-color', label: '색상' },
  { id: 'foundations-type', label: '타이포그래피' },
  { id: 'foundations-space', label: '간격' },
  { id: 'foundations-radius', label: '모서리' },
  { id: 'foundations-elevation', label: '그림자' },
  { id: 'foundations-motion', label: '모션' },
  { id: 'components-buttons', label: '버튼' },
  { id: 'components-fields', label: '입력 필드' },
  { id: 'components-data', label: '데이터 · 상태' },
  { id: 'components-feedback', label: '피드백 · 다이얼로그' },
]

type SampleRow = {
  time: string
  patient: string
  task: string
  status: string
  tone: BadgeTone
}

const SAMPLE_ROWS: SampleRow[] = [
  { time: '09:00', patient: '이은정', task: '방문 예정', status: '예정', tone: 'info' },
  { time: '11:30', patient: '김민수', task: '복약 확인', status: '진행중', tone: 'warn' },
  { time: '14:00', patient: '최성수', task: '정산 확인', status: '완료', tone: 'success' },
]

const SAMPLE_COLUMNS: TableColumn<SampleRow>[] = [
  { key: 'time', header: '시간', cell: (row) => row.time },
  { key: 'patient', header: '대상자', cell: (row) => row.patient },
  { key: 'task', header: '업무', cell: (row) => row.task },
  {
    key: 'status',
    header: '상태',
    cell: (row) => (
      <Badge tone={row.tone} plain>
        {row.status}
      </Badge>
    ),
  },
]

/**
 * :root에서 토큰의 계산된 값을 읽어 표시값으로 돌려준다(하드코딩 중복 방지).
 * 라이트 단일 테마라 런타임에 값이 바뀌지 않으므로, 마운트 시 1회 lazy 초기화로
 * 읽는다(effect+setState 없이 — React Compiler/규칙과도 호환).
 */
const readTokens = (tokens: string[]): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {}
  }
  const styles = getComputedStyle(document.documentElement)
  const next: Record<string, string> = {}
  for (const token of tokens) {
    next[token] = styles.getPropertyValue(token).trim()
  }
  return next
}

const useResolvedTokens = (tokens: string[]): Record<string, string> => {
  const [resolved] = useState(() => readTokens(tokens))
  return resolved
}

export const DesignSystemPage = ({ onBack }: { onBack?: () => void }) => {
  const allColorTokens = useMemo(
    () => COLOR_GROUPS.flatMap((group) => group.swatches.map((s) => s.token)),
    []
  )
  const colorValues = useResolvedTokens(allColorTokens)
  const typeValues = useResolvedTokens(useMemo(() => TYPE_SCALE.map((t) => t.token), []))
  const spacingValues = useResolvedTokens(SPACING_TOKENS)
  const radiusValues = useResolvedTokens(RADIUS_TOKENS)
  const shadowValues = useResolvedTokens(SHADOW_TOKENS)
  const motionValues = useResolvedTokens(MOTION_TOKENS)

  const [motionOn, setMotionOn] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const demoFieldId = useId()

  const goHome = () => {
    if (onBack) {
      onBack()
      return
    }
    if (typeof window !== 'undefined') {
      globalThis.location.assign('/')
    }
  }

  return (
    <main className="public-page ds-main" aria-labelledby="ds-title">
      <header className="public-nav" aria-label="디자인 시스템 내비게이션">
        <button type="button" className="public-brand" onClick={goHome}>
          <span className="brand-mark" aria-hidden="true">
            <Icon name="heart" size={18} />
          </span>
          <span>
            <strong>
              가족 돌봄 운영 플랫폼 <span className="beta-badge">BETA</span>
            </strong>
            <small>DESIGN SYSTEM</small>
          </span>
        </button>
        <nav className="public-nav-actions" aria-label="섹션 바로가기">
          <a className="public-anchor-link" href="#foundations-color">
            색상
          </a>
          <a className="public-anchor-link" href="#foundations-type">
            타이포
          </a>
          <a className="public-anchor-link" href="#components-buttons">
            컴포넌트
          </a>
          <Button variant="secondary" size="sm" onClick={goHome}>
            <Icon name="arrow-right" size={15} />
            서비스로
          </Button>
        </nav>
      </header>

      <section className="ds-hero">
        <p className="page-eyebrow">Design System</p>
        <h1 id="ds-title">가족 돌봄 운영 플랫폼 디자인 시스템</h1>
        <p className="ds-hero-lede">
          따뜻하고 차분한 운영 도구를 위한 토큰과 컴포넌트를 한곳에 모았습니다. 모든 색상은 OKLCH로
          정의된 단일 소스이며, 이 페이지의 값은 실행 중인 토큰에서 직접 읽어옵니다.
        </p>
        <div className="ds-hero-tags">
          <Badge tone="accent" plain>
            OKLCH 토큰
          </Badge>
          <Badge tone="neutral" plain>
            Light only
          </Badge>
          <Badge tone="success" plain>
            WCAG AA 대비
          </Badge>
          <Badge tone="info" plain>
            Pretendard
          </Badge>
        </div>
      </section>

      <div className="ds-layout">
        <nav className="ds-toc" aria-label="페이지 내 목차">
          <p className="ds-toc-title">목차</p>
          <ul>
            {TOC_SECTIONS.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ds-content">
          {/* ============================================ FOUNDATIONS: COLOR */}
          <section id="foundations-color" className="ds-section" aria-labelledby="ds-color-h">
            <div className="ds-section-head">
              <h2 id="ds-color-h">색상</h2>
              <p>
                Restrained 전략. 따뜻한 sand 중립이 표면을 만들고 sage 액센트가 신뢰를 더합니다. 각
                스와치는 토큰 이름과 실행 시 계산된 값을 함께 보여줍니다.
              </p>
            </div>
            {COLOR_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="ds-subhead">{group.title}</p>
                <p className="ds-caption" style={{ marginBottom: 'var(--space-3)' }}>
                  {group.description}
                </p>
                <div className="ds-swatch-grid">
                  {group.swatches.map((swatch) => (
                    <div className="ds-swatch" key={swatch.token}>
                      <span
                        className="ds-swatch-chip"
                        style={{ background: `var(${swatch.token})` }}
                        aria-hidden="true"
                      />
                      <span className="ds-swatch-meta">
                        <span className="ds-swatch-name">{swatch.name}</span>
                        <code className="ds-swatch-token">{swatch.token}</code>
                        <code className="ds-swatch-value">{colorValues[swatch.token] || '—'}</code>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* ============================================= FOUNDATIONS: TYPE */}
          <section id="foundations-type" className="ds-section" aria-labelledby="ds-type-h">
            <div className="ds-section-head">
              <h2 id="ds-type-h">타이포그래피</h2>
              <p>
                Pretendard Variable 단일 패밀리. 약 1.25배 비율의 고정 rem 스케일이 제목부터 데이터
                라벨까지 한 가족으로 흐름을 만듭니다.
              </p>
            </div>
            <div className="ds-type-list">
              {TYPE_SCALE.map((step) => (
                <div className="ds-type-row" key={step.token}>
                  <span className="ds-type-label">
                    {step.label} · {typeValues[step.token] || '—'}
                  </span>
                  <span className="ds-type-sample" style={{ fontSize: `var(${step.token})` }}>
                    돌봄을 잇는 운영
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p className="ds-subhead">본문 측정값 (--measure, 65–75ch)</p>
              <p className="ds-measure-sample">
                본문 텍스트는 한 줄에 약 68자(--measure: 68ch)로 제한해 읽기 흐름을 유지합니다. 방문
                일정부터 보험청구까지, 센터 담당자가 오늘 해야 할 일을 놓치지 않도록 정보를 차분하게
                배치하고 한 가지 액센트로만 시선을 안내합니다.
              </p>
            </div>
          </section>

          {/* ============================================ FOUNDATIONS: SPACE */}
          <section id="foundations-space" className="ds-section" aria-labelledby="ds-space-h">
            <div className="ds-section-head">
              <h2 id="ds-space-h">간격</h2>
              <p>4px 기준의 스페이싱 스케일. 같은 리듬을 공유해 화면 간 밀도가 일관됩니다.</p>
            </div>
            <div className="ds-spacing-list">
              {SPACING_TOKENS.map((token) => (
                <div className="ds-spacing-row" key={token}>
                  <span className="ds-spacing-label">
                    {token.replace('--', '')} · {spacingValues[token] || '—'}
                  </span>
                  <span className="ds-spacing-bar" style={{ width: `var(${token})` }} />
                </div>
              ))}
            </div>
          </section>

          {/* =========================================== FOUNDATIONS: RADIUS */}
          <section id="foundations-radius" className="ds-section" aria-labelledby="ds-radius-h">
            <div className="ds-section-head">
              <h2 id="ds-radius-h">모서리</h2>
              <p>xs부터 full까지. 카드·버튼·배지가 톤에 맞는 둥글기를 공유합니다.</p>
            </div>
            <div className="ds-tile-grid">
              {RADIUS_TOKENS.map((token) => (
                <div className="ds-tile" key={token}>
                  <span
                    className="ds-radius-box"
                    style={{ borderRadius: `var(${token})` }}
                    aria-hidden="true"
                  />
                  <span className="ds-tile-label">
                    {token.replace('--radius-', '')} · {radiusValues[token] || '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================== FOUNDATIONS: ELEVATION */}
          <section
            id="foundations-elevation"
            className="ds-section"
            aria-labelledby="ds-elevation-h"
          >
            <div className="ds-section-head">
              <h2 id="ds-elevation-h">그림자 (Elevation)</h2>
              <p>
                따뜻한 OKLCH 색조의 부드러운 4단계 그림자. 유리질(glassmorphism) 효과는 사용하지
                않습니다.
              </p>
            </div>
            <div className="ds-tile-grid">
              {SHADOW_TOKENS.map((token) => (
                <div className="ds-tile" key={token}>
                  <span
                    className="ds-elevation-box"
                    style={{ boxShadow: `var(${token})` }}
                    aria-hidden="true"
                  />
                  <span className="ds-tile-label">{token.replace('--shadow-', 'shadow-')}</span>
                  <span className="ds-swatch-value">{shadowValues[token] || '—'}</span>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================== FOUNDATIONS: MOTION */}
          <section id="foundations-motion" className="ds-section" aria-labelledby="ds-motion-h">
            <div className="ds-section-head">
              <h2 id="ds-motion-h">모션</h2>
              <p>
                150–250ms, ease-out 일관. 바운스 없음. 모든 전환에 prefers-reduced-motion 폴백이
                있습니다.
              </p>
            </div>
            <div className={`ds-motion${motionOn ? ' is-on' : ''}`}>
              <span className="ds-motion-track" aria-hidden="true">
                <span className="ds-motion-dot" />
              </span>
              <Button variant="secondary" size="sm" onClick={() => setMotionOn((v) => !v)}>
                <Icon name="refresh" size={15} />
                전환 토글 ({motionValues['--dur-slow'] || '250ms'} · ease-out)
              </Button>
            </div>
            <div className="ds-specimen-row">
              {MOTION_TOKENS.map((token) => (
                <code className="ds-swatch-token" key={token}>
                  {token.replace('--', '')}: {motionValues[token] || '—'}
                </code>
              ))}
            </div>
          </section>

          <hr className="ds-divider" />

          {/* ============================================ COMPONENTS: BUTTONS */}
          <section id="components-buttons" className="ds-section" aria-labelledby="ds-btn-h">
            <div className="ds-section-head">
              <h2 id="ds-btn-h">버튼</h2>
              <p>
                primary / secondary / ghost, md·sm 크기. 비활성 상태를 포함한 실제 컴포넌트입니다.
              </p>
            </div>
            <div className="ds-specimen">
              <p className="ds-subhead">Variant</p>
              <div className="ds-specimen-row">
                <Button>주요 액션</Button>
                <Button variant="secondary">보조 액션</Button>
                <Button variant="ghost">고스트</Button>
              </div>
              <p className="ds-caption">기본 / 보조 / 외곽선 없는 인라인 버튼</p>

              <p className="ds-subhead">Size · Icon · Disabled</p>
              <div className="ds-specimen-row">
                <Button size="sm">
                  <Icon name="plus" size={15} />
                  작게 + 아이콘
                </Button>
                <Button variant="secondary" size="sm">
                  <Icon name="refresh" size={15} />
                  새로고침
                </Button>
                <Button disabled>비활성</Button>
              </div>
              <p className="ds-caption">sm 크기는 보조 액션·툴바, disabled는 opacity 0.55</p>

              <p className="ds-subhead">Badge tones</p>
              <div className="ds-specimen-row">
                {BADGE_TONES.map((tone) => (
                  <Badge key={tone} tone={tone}>
                    {tone}
                  </Badge>
                ))}
              </div>
              <p className="ds-caption">점 마커 포함 / plain은 텍스트 전용 태그</p>
            </div>
          </section>

          {/* ============================================= COMPONENTS: FIELDS */}
          <section id="components-fields" className="ds-section" aria-labelledby="ds-field-h">
            <div className="ds-section-head">
              <h2 id="ds-field-h">입력 필드</h2>
              <p>
                Field 셸이 라벨·힌트·에러를 묶고 id와 aria-describedby/aria-invalid를 자동
                연결합니다. 기본·포커스·에러·비활성 상태를 함께 확인하세요.
              </p>
            </div>
            <div className="ds-fields">
              <Field label="담당자 이름" hint="예) 김현지" required>
                {(p) => <Input placeholder="이름을 입력하세요" {...p} />}
              </Field>
              <Field label="이메일" error="올바른 이메일 주소 형식을 입력해 주세요.">
                {(p) => <Input defaultValue="name@" {...p} />}
              </Field>
              <Field label="요금제 선택">
                {(p) => (
                  <Select defaultValue="pro" {...p}>
                    <option value="starter">스타터</option>
                    <option value="pro">프로</option>
                    <option value="enterprise">엔터프라이즈</option>
                  </Select>
                )}
              </Field>
              <Field label="비활성 입력" hint="읽기 전용 예시">
                {(p) => <Input value="수정할 수 없는 값" disabled readOnly {...p} />}
              </Field>
            </div>
            <Field label="돌봄 메모" hint="방문·상담·투약 내용을 자유롭게 기록합니다.">
              {(p) => <Textarea placeholder="오늘 돌봄 내용을 적어주세요" {...p} />}
            </Field>
            <p className="ds-caption">
              포커스 시 sage 링(box-shadow), 에러 시 aria-invalid + danger 경계선이 적용됩니다. 위
              필드를 클릭/탭하면 포커스 상태를 직접 확인할 수 있습니다.
            </p>
            <label className="ds-caption" htmlFor={demoFieldId}>
              표준 검색 인풋(키보드 포커스 테스트):
            </label>
            <Input id={demoFieldId} type="search" placeholder="질문 또는 답변 검색" />
          </section>

          {/* =========================================== COMPONENTS: DATA */}
          <section id="components-data" className="ds-section" aria-labelledby="ds-data-h">
            <div className="ds-section-head">
              <h2 id="ds-data-h">데이터 · 상태</h2>
              <p>
                Stat(차분한 라벨+값, hero-metric 패턴 배제), 반응형 Table(48rem 미만에서 라벨-값
                카드로 접힘), Card, EmptyState를 보여줍니다.
              </p>
            </div>

            <p className="ds-subhead">Stat</p>
            <div className="stat-row">
              <Stat label="오늘 방문" value="3건" icon="schedule" foot="예정 2 · 진행 1" />
              <Stat label="확인할 청구" value="2건" icon="claims" foot="검토 대기" />
              <Stat
                label="이번 달 정산"
                value="₩1,280,000"
                valueLabel="이번 달 정산 128만원"
                icon="settlement"
              />
              <Stat label="기록 완료율" value="98%" icon="care" foot="누락 1건" />
            </div>

            <p className="ds-subhead">Card</p>
            <div className="ds-card-row">
              <Card>
                <CardHeader
                  title="방문 일정"
                  subtitle="오늘 방문할 대상자와 담당자"
                  action={
                    <Button size="sm" variant="secondary">
                      전체 보기
                    </Button>
                  }
                />
                <Table
                  columns={SAMPLE_COLUMNS}
                  rows={SAMPLE_ROWS}
                  rowKey={(row) => row.time}
                  caption="디자인 시스템 예시 일정 표"
                />
              </Card>
              <Card>
                <CardHeader title="빈 상태" subtitle="EmptyState 컴포넌트" titleAs="h3" />
                <EmptyState
                  icon="inbox"
                  title="아직 등록된 기록이 없습니다"
                  description="첫 돌봄 기록을 남기면 여기에 표시됩니다."
                  action={
                    <Button size="sm">
                      <Icon name="plus" size={15} />
                      기록 추가
                    </Button>
                  }
                />
              </Card>
            </div>

            <p className="ds-subhead">Skeleton (로딩)</p>
            <Card>
              <SkeletonLines lines={3} />
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Skeleton width="40%" height="2rem" />
              </div>
            </Card>
            <p className="ds-caption">
              스피너 대신 콘텐츠 구조를 흉내 내는 스켈레톤으로 레이아웃 점프를 줄입니다.
            </p>
          </section>

          {/* ====================================== COMPONENTS: FEEDBACK */}
          <section id="components-feedback" className="ds-section" aria-labelledby="ds-fb-h">
            <div className="ds-section-head">
              <h2 id="ds-fb-h">피드백 · 다이얼로그</h2>
              <p>
                인라인 피드백(error/warning/loading)과 Radix 기반 ConfirmDialog. 모달은 포커스
                트랩·Esc 닫기·포커스 복원을 보장하며 포털로 오버플로를 탈출합니다.
              </p>
            </div>

            <p className="ds-subhead">Inline feedback</p>
            <div className="ds-specimen">
              <p className="feedback feedback-error" role="alert">
                <Icon name="close" size={16} />
                저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
              </p>
              <p className="feedback feedback-warning" role="status">
                <Icon name="shield" size={16} />
                현재 계정은 일부 기능이 제한될 수 있습니다.
              </p>
              <button
                type="button"
                className="feedback feedback-loading"
                onClick={() => setShowLoading((v) => !v)}
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 0 }}
              >
                <Icon name="refresh" size={16} />
                {showLoading ? '데이터를 불러오는 중입니다…' : '눌러서 로딩 피드백 보기'}
              </button>
            </div>

            <p className="ds-subhead">ConfirmDialog</p>
            <div className="ds-specimen-row">
              <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                <Icon name="trash" size={15} />
                확인 다이얼로그 열기
              </Button>
            </div>
            <p className="ds-caption">
              danger 톤은 안전한 취소 버튼에 초기 포커스를 둬 오발동을 막습니다.
            </p>
            <ConfirmDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              title="기록을 삭제할까요?"
              description="삭제한 돌봄 기록은 복구할 수 없습니다."
              confirmLabel="삭제"
              tone="danger"
              onConfirm={() => setDialogOpen(false)}
            />
          </section>

          {/* PageHeader는 운영 페이지의 표준 헤더 — 실제 컴포넌트로 노출 */}
          <section className="ds-section" aria-labelledby="ds-ph-h">
            <div className="ds-section-head">
              <h2 id="ds-ph-h">PageHeader</h2>
              <p>운영 화면 상단의 표준 헤더. eyebrow·제목·설명·액션 영역을 일관되게 배치합니다.</p>
            </div>
            <Card>
              <PageHeader
                eyebrow="돌봄 운영"
                title="방문 일정"
                description="방문 예정 시간, 담당자, 진행 상태를 확인하고 새 일정을 등록합니다."
                actions={
                  <Button size="sm">
                    <Icon name="plus" size={15} />새 일정
                  </Button>
                }
              />
            </Card>
          </section>
        </div>
      </div>

      <footer className="public-footer" aria-label="디자인 시스템 정보">
        <p className="public-footer-meta">
          © {new Date().getFullYear()} 가족 돌봄 운영 플랫폼 · 디자인 시스템은{' '}
          <code>apps/web/src/styles.css</code>의 토큰을 단일 소스로 사용합니다.
        </p>
      </footer>
    </main>
  )
}
