export default function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className = '',
}) {
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-xs font-semibold text-rosewood">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
      </label>
      {typeof children === 'function'
        ? children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })
        : children}
      {hint && <p id={`${id}-hint`} className="text-xs leading-5 text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs leading-5 text-danger" role="alert">{error}</p>}
    </div>
  )
}
