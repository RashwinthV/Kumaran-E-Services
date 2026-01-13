import React, { useState, useEffect } from "react";
import { getDecrypted, saveEncrypted } from "../../utils/storage";
import { toast } from "react-toastify";

const ServiceSettingsModal = ({ isOpen, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState({
    defaultServiceCharge: 0,
    enableServiceTax: false,
    serviceTaxRate: 18,
    showHelperText: true,
    autoPrintServiceReceipt: true,
  });

  useEffect(() => {
    if (isOpen) {
      const saved = getDecrypted("service_settings") || {};
      setLocalSettings((prev) => ({ ...prev, ...saved }));
    }
  }, [isOpen]);

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveEncrypted("service_settings", localSettings);
    toast.success("Service settings saved!");
    if (onSave) onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header bg-primary text-white rounded-top-4">
            <h5 className="modal-title fw-bold ">
              <i className="bi bi-gear-fill me-2"></i>Service Settings
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-4">
            <h6 className="fw-bold text-muted text-uppercase mb-3 small">
              General Configuration
            </h6>

            <div className="mb-3">
              <div className="form-check form-switch p-0 d-flex justify-content-between align-items-center bg-light p-3 rounded-3 border">
                <label className="form-check-label fw-bold mb-0">
                  <i className="bi bi-info-circle text-primary me-2"></i>
                  Show Helper Text
                  <div className="text-muted small fw-normal mt-1">
                    Display hints and tips for service inputs
                  </div>
                </label>
                <input
                  className="form-check-input ms-3"
                  type="checkbox"
                  checked={localSettings.showHelperText}
                  onChange={(e) =>
                    handleChange("showHelperText", e.target.checked)
                  }
                  style={{ width: "2.5em", height: "1.25em" }}
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="form-check form-switch p-0 d-flex justify-content-between align-items-center bg-light p-3 rounded-3 border">
                <label className="form-check-label fw-bold mb-0">
                  <i className="bi bi-printer text-success me-2"></i>
                  Auto-Print Receipt
                  <div className="text-muted small fw-normal mt-1">
                    Automatically print receipt after service sale
                  </div>
                </label>
                <input
                  className="form-check-input ms-3"
                  type="checkbox"
                  checked={localSettings.autoPrintServiceReceipt}
                  onChange={(e) =>
                    handleChange("autoPrintServiceReceipt", e.target.checked)
                  }
                  style={{ width: "2.5em", height: "1.25em" }}
                />
              </div>
            </div>

            <hr className="my-4 opacity-25" />

            <h6 className="fw-bold text-muted text-uppercase mb-3 small">
              Financial Defaults
            </h6>

            <div className="mb-3">
              <label className="form-label fw-bold small">
                Default Service Tax (%)
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-percent"></i>
                </span>
                <input
                  type="number"
                  className="form-control"
                  value={localSettings.serviceTaxRate}
                  onChange={(e) =>
                    handleChange("serviceTaxRate", parseFloat(e.target.value))
                  }
                />
                <div className="input-group-text bg-light p-0">
                  <div className="form-check form-switch mx-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={localSettings.enableServiceTax}
                      onChange={(e) =>
                        handleChange("enableServiceTax", e.target.checked)
                      }
                    />
                  </div>
                </div>
              </div>
              <small className="text-muted">
                Enable to apply tax by default on taxable services
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small">
                Default Service Charge (Fixed ₹)
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">₹</span>
                <input
                  type="number"
                  className="form-control"
                  value={localSettings.defaultServiceCharge}
                  onChange={(e) =>
                    handleChange(
                      "defaultServiceCharge",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </div>
          <div className="modal-footer border-top-0 bg-light rounded-bottom-4">
            <button
              type="button"
              className="btn btn-light text-muted fw-bold"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary fw-bold px-4"
              onClick={handleSave}
            >
              <i className="bi bi-save me-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSettingsModal;
