import React from "react";
import "../../Styles/ShortcutGuide.css";

const ShortcutGuide = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "F1", desc: "New Customer" },
    { key: "F2", desc: "Search Products" },
    { key: "F4", desc: "Clear Bill" },
    { key: "F6", desc: "Focus Search" },
    { key: "F8", desc: "Focus Discount" },
    { key: "F9", desc: "Save Sale" },
    { key: "F10", desc: "Print & Save" },
    { key: "F11", desc: "View Reports" },
    { key: "F12", desc: "Shortcut Guide" },
    { key: "Ctrl + Enter", desc: "Complete Sale" },
    { key: "Esc", desc: "Cancel / Close Modals" },
    { key: "Ctrl + Z", desc: "Remove Last Item" },
    { key: "Ctrl + Y", desc: "Undo Removal (Redo)" },
    { key: "Alt + a", desc: "Settings" },
    { key: "Alt + L", desc: "Logout" },
    { key: "Alt + c", desc: "Credit Customers" },
    { key: "Ctrl + F", desc: "Product Catalog" },
    { key: "Alt + s", desc: "Sale History" },
  ];

  return (
    <div className="shortcut-guide-overlay" onClick={onClose}>
      <div
        className="shortcut-guide-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcut-guide-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-keyboard text-primary fs-4"></i>
            <h5 className="mb-0 fw-bold">Keyboard Shortcuts</h5>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="shortcut-guide-body">
          <div className="row g-3">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="col-6">
                <div className="shortcut-item d-flex align-items-center justify-content-between p-2 rounded">
                  <span className="shortcut-desc text-muted small">
                    {s.desc}
                  </span>
                  <kbd className="shortcut-key bg-light text-dark border shadow-sm">
                    {s.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="shortcut-guide-footer text-center py-2 border-top bg-light rounded-bottom-4">
          <small className="text-muted">
            Press <kbd>F12</kbd> or <kbd>Esc</kbd> to close this guide
          </small>
        </div>
      </div>
    </div>
  );
};

export default ShortcutGuide;
