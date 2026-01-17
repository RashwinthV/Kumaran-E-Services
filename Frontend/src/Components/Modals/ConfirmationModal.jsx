import React from "react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, primary, warning
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2100" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4 animate-modal">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {type === "danger" && (
                <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              )}
              {type === "warning" && (
                <i className="bi bi-exclamation-circle-fill text-warning me-2"></i>
              )}
              {type === "primary" && (
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
              )}
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body py-3">
            <p className="text-muted mb-0">{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-light fw-bold px-4"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn btn-${type} fw-bold px-4`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
