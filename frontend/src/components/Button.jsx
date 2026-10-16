const variants = {
  primary: 'bg-caramel text-action-ink shadow-sm hover:bg-caramel-hover disabled:bg-rosewood-soft',
  secondary: 'border border-border bg-paper text-rosewood hover:border-caramel hover:bg-petal',
  subtle: 'text-rosewood hover:bg-petal',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:bg-rosewood-soft',
}

const sizes = {
  sm: 'min-h-9 px-3 text-[11px]',
  md: 'min-h-10 px-4 text-xs',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
