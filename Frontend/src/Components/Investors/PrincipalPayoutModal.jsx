import React, { useState } from "react";

const PrincipalPayoutModal = ({ isOpen, onClose, investor, onSave }) => {
  const [formData, setFormData] = useState({
    amount: "",
    payoutDate: new Date().toISOString().split("T")[0],
    mode: "cash",
    reference: "",
    reason: "",
    notes: "",
  });

  const [error, setError] = useState("");
  // Initialize with the default bank account ID or the first one if available
  const [selectedBankId, setSelectedBankId] = useState(
    investor?.bankAccounts?.find((b) => b.isDefault)?.id ||
      investor?.bankAccounts?.[0]?.id ||
      ""
  );

  // Initialize with the default UPI account ID or the first one if available
  const [selectedUpiId, setSelectedUpiId] = useState(
    investor?.upiAccounts?.find((u) => u.isDefault)?.id ||
      investor?.upiAccounts?.[0]?.id ||
      ""
  );

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
        <div className="modal-content shadow-lg border-0 rounded-4 animate-modal">
          <div
            className="modal-header bg-danger text-white rounded-top-4"
            style={{ maxHeight: "100vh", overflow: "auto" }}
          >
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
            <div
              className="modal-body p-4 overflow-auto "
              style={{ maxHeight: "70vh" }}
            >
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
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Payment Mode <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.mode}
                    onChange={(e) => handleChange("mode", e.target.value)}
                    required
                  >
                    <option value="cash">Cash (Physical)</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    {formData.mode === "cheque"
                      ? "Cheque Number"
                      : formData.mode === "bank" || formData.mode === "upi"
                      ? "Transaction ID"
                      : "Reference Number"}
                    {formData.mode === "cheque" && (
                      <span className="text-danger">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.reference}
                    onChange={(e) => handleChange("reference", e.target.value)}
                    placeholder={
                      formData.mode === "cheque"
                        ? "Enter cheque number"
                        : formData.mode === "bank"
                        ? "NEFT/IMPS/RTGS Ref"
                        : "Optional reference"
                    }
                    required={formData.mode === "cheque"}
                  />
                </div>

                {/* Bank Details Display */}
                {formData.mode === "bank" && (
                  <div className="col-md-12">
                    <div className="card bg-light border-0 small">
                      <div className="card-body py-2">
                        <h6 className="fw-bold mb-2 text-muted">
                          <i className="bi bi-bank me-2"></i>Investor Bank
                          Details
                        </h6>
                        {investor.bankAccounts &&
                        investor.bankAccounts.length > 0 ? (
                          <>
                            <div className="mb-3">
                              <label className="form-label small text-muted">
                                Select Bank Account:
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={selectedBankId}
                                onChange={(e) =>
                                  setSelectedBankId(parseInt(e.target.value))
                                }
                              >
                                {investor.bankAccounts.map((bank) => (
                                  <option key={bank.id} value={bank.id}>
                                    {bank.bankName} -{" "}
                                    {bank.accountNumber.slice(-4)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {(() => {
                              const selectedBank =
                                investor.bankAccounts.find(
                                  (b) => b.id === selectedBankId
                                ) || investor.bankAccounts[0];
                              return (
                                <div className="row g-2">
                                  <div className="col-6">
                                    <span className="text-muted d-block">
                                      Bank:
                                    </span>
                                    <span className="fw-bold">
                                      {selectedBank.bankName || "N/A"}
                                    </span>
                                  </div>
                                  <div className="col-6">
                                    <span className="text-muted d-block">
                                      Account No:
                                    </span>
                                    <span className="fw-bold font-monospace">
                                      {selectedBank.accountNumber}
                                    </span>
                                  </div>
                                  <div className="col-6">
                                    <span className="text-muted d-block">
                                      IFSC:
                                    </span>
                                    <span className="fw-bold font-monospace">
                                      {selectedBank.ifsc || "N/A"}
                                    </span>
                                  </div>
                                  <div className="col-6">
                                    <span className="text-muted d-block">
                                      Holder:
                                    </span>
                                    <span className="fw-bold">
                                      {selectedBank.accountHolderName ||
                                        investor.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        ) : investor.bankDetails &&
                          investor.bankDetails.accountNumber ? (
                          <div className="row g-2">
                            <div className="col-6">
                              <span className="text-muted d-block">Bank:</span>
                              <span className="fw-bold">
                                {investor.bankDetails.bankName || "N/A"}
                              </span>
                            </div>
                            <div className="col-6">
                              <span className="text-muted d-block">
                                Account No:
                              </span>
                              <span className="fw-bold font-monospace">
                                {investor.bankDetails.accountNumber}
                              </span>
                            </div>
                            <div className="col-6">
                              <span className="text-muted d-block">IFSC:</span>
                              <span className="fw-bold font-monospace">
                                {investor.bankDetails.ifsc || "N/A"}
                              </span>
                            </div>
                            <div className="col-6">
                              <span className="text-muted d-block">
                                Holder:
                              </span>
                              <span className="fw-bold">
                                {investor.bankDetails.accountHolderName ||
                                  investor.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-danger">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            No bank details found for this investor.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Details Display */}
                {formData.mode === "upi" && (
                  <div className="col-md-12">
                    <div className="card bg-light border-0 small">
                      <div className="card-body py-2">
                        <h6 className="fw-bold mb-2 text-muted">
                          <i className="bi bi-qr-code me-2"></i>Investor UPI
                          Details
                        </h6>
                        {investor.upiAccounts &&
                        investor.upiAccounts.length > 0 ? (
                          <>
                            <div className="mb-3">
                              <label className="form-label small text-muted">
                                Select UPI Account:
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={selectedUpiId}
                                onChange={(e) =>
                                  setSelectedUpiId(parseInt(e.target.value))
                                }
                              >
                                {investor.upiAccounts.map((upi) => (
                                  <option key={upi.id} value={upi.id}>
                                    {upi.upiId}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {(() => {
                              const selectedUpi =
                                investor.upiAccounts.find(
                                  (u) => u.id === selectedUpiId
                                ) || investor.upiAccounts[0];
                              return (
                                <div className="row g-2">
                                  <div className="col-6">
                                    <span className="text-muted d-block">
                                      UPI ID:
                                    </span>
                                    <span className="fw-bold font-monospace">
                                      {selectedUpi.upiId}
                                    </span>
                                  </div>
                                  <div className="col-6">
                                    <span className="text-muted d-block">
                                      Phone:
                                    </span>
                                    <span className="fw-bold font-monospace">
                                      {selectedUpi.upiPhone || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        ) : investor.upiDetails && investor.upiDetails.upiId ? (
                          <div className="row g-2">
                            <div className="col-6">
                              <span className="text-muted d-block">
                                UPI ID:
                              </span>
                              <span className="fw-bold font-monospace">
                                {investor.upiDetails.upiId}
                              </span>
                            </div>
                            <div className="col-6">
                              <span className="text-muted d-block">Phone:</span>
                              <span className="fw-bold font-monospace">
                                {investor.upiDetails.upiPhone || "N/A"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-danger">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            No UPI details found for this investor.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
              {/* Payout History */}
              {/*     {investor.payoutHistory && investor.payoutHistory.length > 0 && (
                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 fw-bold">
                      <i className="bi bi-clock-history me-2"></i>Payout History
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Mode</th>
                            <th>Reference</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investor.payoutHistory.map((payout, index) => (
                            <tr key={payout.id || index}>
                              <td className="fw-bold text-muted">
                                {index + 1}
                              </td>
                              <td>
                                {new Date(payout.date).toLocaleDateString()}
                              </td>
                              <td className="fw-bold text-danger">
                                ₹{parseFloat(payout.amount).toLocaleString()}
                              </td>
                              <td className="text-capitalize">
                                {payout.type || payout.reason || "Principal"}
                              </td>
                              <td className="text-capitalize">
                                {payout.mode || "—"}
                              </td>
                              <td className="font-monospace small">
                                {payout.reference || "—"}
                              </td>
                              <td>
                                <span className="badge bg-success">
                                  {payout.status || "Paid"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}*/}
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
