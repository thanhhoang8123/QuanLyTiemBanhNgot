import Button from './Button.jsx'
import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  title = 'Xác nhận thao tác',
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  confirmVariant = 'danger',
  onConfirm,
  onClose,
  busy = false,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="max-w-md"
      closeOnEscape={!busy}
      closeOnBackdrop={!busy}
      closeDisabled={busy}
    >
      {description && <p className="text-sm leading-6 text-muted">{description}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? 'Đang xử lý...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
