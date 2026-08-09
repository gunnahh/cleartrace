import type { ReactNode } from 'react'
export function Field({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <em aria-hidden="true"> *</em>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
      {error && (
        <small className="error" role="alert">
          {error}
        </small>
      )}
    </label>
  )
}
