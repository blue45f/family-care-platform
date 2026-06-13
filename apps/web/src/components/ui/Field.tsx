import { useId } from 'react'

import { cn } from '../../utils/cn'

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

type FieldShellProps = {
  label: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  /** 입력 컨트롤을 렌더할 함수. id/접근성 속성을 받아 연결한다. */
  children: (props: {
    id: string
    'aria-invalid': boolean | undefined
    'aria-describedby': string | undefined
  }) => ReactNode
}

/**
 * 라벨 + 힌트 + 에러를 하나로 묶는 접근성 셸.
 * id 연결과 aria-describedby/aria-invalid를 자동으로 처리한다.
 */
export const Field = ({ label, required, hint, error, children }: FieldShellProps) => {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field-req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && !error ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn('input', className)} {...props} />
)

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn('textarea', className)} {...props} />
)

export const Select = ({
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn('select', className)} {...props}>
    {children}
  </select>
)
