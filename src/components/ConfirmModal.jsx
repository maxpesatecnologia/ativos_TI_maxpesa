import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmModal({
  open,
  title = 'Confirmar exclusão',
  message,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} icon={AlertTriangle} tone="danger">
      <p>{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ backgroundColor: 'var(--status-danger)' }}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
