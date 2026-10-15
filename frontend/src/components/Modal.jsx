import { useEffect } from 'react'
import Icon from './Icon.jsx'

export default function Modal({ open, title, onClose, children, size = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-rosewood/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-modal-title"
        className={`max-h-[min(90vh,800px)] w-full ${size} overflow-y-auto rounded-2xl border border-border bg-paper shadow-xl shadow-rosewood/10`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-paper/95 px-5 py-4 backdrop-blur sm:px-6">
          <h2 id="shared-modal-title" className="font-display text-xl font-semibold text-rosewood">{title}</h2>
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-rosewood transition hover:bg-petal"
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  )
}
