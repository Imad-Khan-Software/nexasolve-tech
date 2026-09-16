import { Modal } from '../modal/Modal.jsx';
import { Button } from './Button.jsx';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {message && <p className="text-sm text-foreground-muted">{message}</p>}
      <div className="mt-6 flex gap-3">
        <Button variant="danger" className="flex-1" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
