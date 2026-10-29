import React from 'react';
import { AlertTriangle, Info, XCircle, X } from 'lucide-react';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  severity?: 'warning' | 'info' | 'error';
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  severity = 'warning',
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div
      className="modal-overlay alert-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content alert-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-modal-header">
          <div className={`alert-modal-icon-badge ${severity}`}>
            {severity === 'warning' ? (
              <AlertTriangle className="alert-modal-icon" size={22} />
            ) : severity === 'info' ? (
              <Info className="alert-modal-icon" size={22} />
            ) : (
              <XCircle className="alert-modal-icon" size={22} />
            )}
          </div>
          <h3 className="modal-title alert-modal-title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="alert-modal-close-btn"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="alert-modal-body">
          <p className="alert-modal-message">{message}</p>
        </div>

        <div className="modal-actions alert-modal-actions">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="btn alert-modal-btn"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
