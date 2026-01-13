import React, { useState } from "react";

const PrincipalPayoutModal = ({ isOpen, onClose, investor, onSave }) => {
  const [formData, setFormData] = useState({
    amount: "",
    payoutDate: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
  });

  const [error, setError] = useState("");

  const currentPrincipal =
    investor?.currentPrincipal || investor?.principalAmount || 0;

  const handleChange = (field, value) => {
    if (field === "amount") {
      const amt = parseFloat(value);
      if (amt > currentPrincipal) {
        setError(
          `Amount cannot exceed current principal of ₹${currentPrincipal.toLocaleString()}`
        );
      } else if (amt <= 0) {
        setError("Amount must be greater than 0");
      } else {
        setError("");
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);

    if (amt > currentPrincipal) {
      setError(
        `Amount cannot exceed current principal of ₹${currentPrincipal.toLocaleString()}`
      );
      return;
    }
    if (amt <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    onSave({
      ...formData,
      amount: amt,
    });
  };

  if (!isOpen || !investor) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2050" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header bg-danger text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-cash-stack me-2"></i>
              Principal Payout - {investor.name}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Warning Alert */}
              <div className="alert alert-warning border-0 mb-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                  <div>
                    <strong>Warning:</strong> This action will reduce the
                    principal amount. Future interest calculations will be based
                    on the remaining principal.
                  </div>
                </div>
              </div>

              {/* Investor Summary */}
              <div className="card border-0 bg-light mb-4">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <small className="text-muted">Original Principal:</small>
                      <div className="fw-bold text-primary">
                        ₹{investor.principalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Current Principal:</small>
                      <div className="fw-bold text-success fs-5">
                        ₹{currentPrincipal.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Interest Rate:</small>
                      <div className="fw-bold text-info">
                        {investor.interestRate}% p.a.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Payout Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${error ? "is-invalid" : ""}`}
                    value={formData.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    required
                    min="0"
                    max={currentPrincipal}
                    step="0.01"
                    placeholder="Enter amount to payout"
                  />
                  {error ? (
                    <div className="invalid-feedback">{error}</div>
                  ) : (
                    <small className="text-muted">
                      Maximum: ₹{currentPrincipal.toLocaleString()}
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Payout Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.payoutDate}
                    onChange={(e) => handleChange("payoutDate", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold small">
                    Reason for Payout <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.reason}
                    onChange={(e) => handleChange("reason", e.target.value)}
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="partial_withdrawal">
                      Partial Withdrawal
                    </option>
                    <option value="emergency">Emergency</option>
                    <option value="reinvestment">Reinvestment Elsewhere</option>
                    <option value="closure">Account Closure</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold small">Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Additional notes or details..."
                  ></textarea>
                </div>
              </div>

              {/* Calculation Preview */}
              {formData.amount && !error && (
                <div className="alert alert-info mt-4">
                  <h6 className="fw-bold mb-2">
                    <i className="bi bi-calculator me-2"></i>After Payout
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted">
                        New Principal Amount:
                      </small>
                      <div className="fw-bold fs-5 text-success">
                        ₹
                        {(
                          currentPrincipal - parseFloat(formData.amount)
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">
                        New Monthly Interest:
                      </small>
                      <div className="fw-bold fs-5 text-primary">
                        ₹
                        {(
                          ((currentPrincipal - parseFloat(formData.amount)) *
                            investor.interestRate) /
                          100 /
                          12
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                type="submit"
                className="btn btn-danger fw-bold px-4"
                disabled={!!error || !formData.amount}
              >
                <i className="bi bi-cash-stack me-2"></i>
                Process Payout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrincipalPayoutModal;
