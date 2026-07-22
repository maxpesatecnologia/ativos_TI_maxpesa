import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import './Toast.css';

const ICONS = { success: CheckCircle2, danger: AlertTriangle };

export default function Toast({ open, message, tone = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, message, duration, onClose]);

  if (!open) return null;

  const Icon = ICONS[tone] || CheckCircle2;

  return (
    <div className={`toast toast-${tone}`} role="status">
      <Icon size={18} />
      <span>{message}</span>
    </div>
  );
}
