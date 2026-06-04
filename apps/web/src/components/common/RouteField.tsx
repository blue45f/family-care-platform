import type { ReactNode } from 'react'

type RouteFieldProps = {
  id: string
  label: string
  children: ReactNode
  /** 검증 에러 메시지. 있으면 입력 아래에 노출하고 `${id}-error` 로 aria-describedby 연결 대상이 된다. */
  error?: string
}

const RouteField = ({ id, label, children, error }: RouteFieldProps) => {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      {children}
      {error ? (
        <span className="field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export { RouteField }
