import type { ReactNode } from 'react'

type RouteFieldProps = {
  id: string
  label: string
  children: ReactNode
}

const RouteField = ({ id, label, children }: RouteFieldProps) => {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export { RouteField }
