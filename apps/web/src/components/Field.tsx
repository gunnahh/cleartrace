import type { ReactNode } from 'react'
export function Field({
  label,
  error,
  required,
  children,
  hint,
  id,
}: {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  hint?: string
  id?: string
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}
        {required && <em aria-hidden="true"> *</em>}
      </span>
      {children}
      {hint && <small id={id ? `${id}-hint` : undefined}>{hint}</small>}
      {error && (
        <small className="error" id={id ? `${id}-error` : undefined} role="alert">
          {error}
        </small>
      )}
    </label>
  )
}
