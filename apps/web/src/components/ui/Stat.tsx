import type { ReactNode } from 'react'

import { Icon, type IconName } from './Icon'

type StatProps = {
  label: ReactNode
  value: ReactNode
  /** 스크린리더용 전체 읽기 텍스트(값이 축약 표기일 때 권장). */
  valueLabel?: string
  icon?: IconName
  foot?: ReactNode
}

/**
 * 차분한 지표 카드. 큰 그라데이션 숫자(hero-metric) 패턴을 의도적으로 피하고,
 * 라벨 + 값 + 보조설명만 절제해서 보여준다.
 */
export const Stat = ({ label, value, valueLabel, icon, foot }: StatProps) => (
  <div className="stat">
    <p className="stat-head">
      {icon ? (
        <span className="nav-icon">
          <Icon name={icon} size={16} />
        </span>
      ) : null}
      {label}
    </p>
    <p className="stat-value" aria-label={valueLabel}>
      <span aria-hidden={valueLabel ? true : undefined}>{value}</span>
    </p>
    {foot ? <p className="stat-foot">{foot}</p> : null}
  </div>
)
