import './Modal.css';

export default function Modal({ open, onClose, title, icon: Icon, tone = 'default', children }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box modal-${tone}`} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            {Icon && <Icon size={20} />}
            <h3>{title}</h3>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
