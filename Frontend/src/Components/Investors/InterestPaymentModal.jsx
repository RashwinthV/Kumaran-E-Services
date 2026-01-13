import React, { useState } from "react";

const InterestPaymentModal = ({
  isOpen,
  onClose,
  onSave,
  investor,
  pendingInterest,
  accumulatedInterest,
  unpaidInterest,
}) => {
  const [formData, setFormData] = useState({
    month: new Date().toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    amount: unpaidInterest,
    paidDate: new Date().toISOString().split("T")[0],
    mode: investor?.paymentMode || "cash",
    products: "",
    notes: "",
  });

  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    if (field === "amount") {
      // Validate amount doesn't exceed unpaid interest
      if (parseFloat(value) > unpaidInterest) {
        setError(
          `Amount cannot exceed unpaid interest of ₹${unpaidInterest.toFixed(
            2
          )}`
        );
      } else {
        setError("");
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.amount > unpaidInterest) {
      setError(
        `Amount cannot exceed unpaid interest of ₹${unpaidInterest.toFixed(2)}`
      );
      return;
    }
    if (formData.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    onSave(formData);
  };

  if (!isOpen || !investor) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2050" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header bg-success text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-cash-coin me-2"></i>
              Pay Interest - {investor.name}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Investor Summary */}
              <div className="alert alert-light border">
                <div className="row">
                  <div className="col-md-3">
                    <small className="text-muted">Principal Amount:</small>
                    <div className="fw-bold text-success">
                      ₹{investor.principalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Interest Rate:</small>
                    <div className="fw-bold text-primary">
                      {investor.interestRate}% p.a.
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Accumulated Interest:</small>
                    <div className="fw-bold text-warning">
                      ₹{accumulatedInterest.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Unpaid Interest:</small>
                    <div className="fw-bold text-danger">
                      ₹{unpaidInterest.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Month <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.month}
                    onChange={(e) => handleChange("month", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Payment Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.paidDate}
                    onChange={(e) => handleChange("paidDate", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Interest Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${error ? "is-invalid" : ""}`}
                    value={formData.amount}
                    onChange={(e) =>
                      handleChange("amount", parseFloat(e.target.value))
                    }
                    required
                    min="0"
                    max={unpaidInterest}
                    step="0.01"
                  />
                  {error ? (
                    <div className="invalid-feedback">{error}</div>
                  ) : (
                    <small className="text-muted">
                      Maximum: ₹{unpaidInterest.toFixed(2)} (Unpaid Interest)
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Payment Mode <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.mode}
                    onChange={(e) => handleChange("mode", e.target.value)}
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="products">Products/Services</option>
                    <option value="reinvest">
                      Reinvest (Add to Principal)
                    </option>
                  </select>
                </div>

                {formData.mode === "products" && (
                  <div className="col-md-12">
                    <label className="form-label fw-bold small">
                      Product/Service Details
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.products}
                      onChange={(e) => handleChange("products", e.target.value)}
                      placeholder="e.g., Groceries worth ₹1000"
                    ></textarea>
                  </div>
                )}

                <div className="col-md-12">
                  <label className="form-label fw-bold small">Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Any additional notes..."
                  ></textarea>
                </div>
              </div>

              {/* Payment Mode Info */}
              <div className="alert alert-info mt-3">
                <h6 className="fw-bold mb-2">
                  <i className="bi bi-info-circle me-2"></i>Payment Mode Info
                </h6>
                {formData.mode === "cash" && (
                  <p className="mb-0 small">
                    Interest will be paid in cash. Principal amount remains
                    unchanged.
                  </p>
                )}
                {formData.mode === "products" && (
                  <p className="mb-0 small">
                    Interest will be settled through products/services.
                    Principal amount remains unchanged.
                  </p>
                )}
                {formData.mode === "reinvest" && (
                  <p className="mb-0 small">
                    Interest will be added to the principal amount. New
                    principal: ₹
                    {(
                      investor.principalAmount + formData.amount
                    ).toLocaleString()}
                  </p>
                )}
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
              <button type="submit" className="btn btn-success fw-bold px-4">
                <i className="bi bi-check-circle me-2"></i>
                Process Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterestPaymentModal;
