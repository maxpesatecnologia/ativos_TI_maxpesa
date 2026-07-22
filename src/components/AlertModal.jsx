import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import Modal from './Modal';

const ICONS = { danger: AlertTriangle, success: CheckCircle2, info: Info };

export default function AlertModal({ open, title, message, tone = 'danger', onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} icon={ICONS[tone] || Info} tone={tone}>
      <p>{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>OK</button>
      </div>
    </Modal>
  );
}
