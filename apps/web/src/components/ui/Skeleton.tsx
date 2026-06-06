import type { CSSProperties } from 'react'

type SkeletonProps = {
  width?: string
  height?: string
  radius?: string
  className?: string
}

/** 로딩 자리표시자. 콘텐츠 구조를 흉내 내 레이아웃 점프를 줄인다. */
export const Skeleton = ({
  width = '100%',
  height = '1rem',
  radius,
  className = '',
}: SkeletonProps) => {
  const style: CSSProperties = { width, height }
  if (radius) {
    style.borderRadius = radius
  }
  return (
    <span
      className={['skeleton', className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    />
  )
}

/** 여러 줄 텍스트 스켈레톤. */
export const SkeletonLines = ({ lines = 3 }: { lines?: number }) => (
  <div className="stack-sm" aria-hidden="true">
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </div>
)
