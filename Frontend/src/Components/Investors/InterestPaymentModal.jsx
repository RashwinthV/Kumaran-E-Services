import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

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
    paymentAccountId: "",
  });

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          const validAccounts = res.data.data.filter(
            (acc) => acc.type !== "Credits",
          );
          setAccounts(validAccounts);
          const cashAcc = validAccounts.find((a) => a.type === "Cash");
          if (cashAcc) {
            setFormData((prev) => ({ ...prev, paymentAccountId: cashAcc._id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const [error, setError] = useState("");
  // Initialize with the default bank account ID or the first one if available
  const [selectedBankId, setSelectedBankId] = useState(
    investor?.bankAccounts?.find((b) => b.isDefault)?.id ||
      investor?.bankAccounts?.[0]?.id ||
      "",
  );

  // Initialize with the default UPI account ID or the first one if available
  const [selectedUpiId, setSelectedUpiId] = useState(
    investor?.upiAccounts?.find((u) => u.isDefault)?.id ||
      investor?.upiAccounts?.[0]?.id ||
      "",
  );

  const handleChange = (field, value) => {
    if (field === "amount") {
      // Validate amount doesn't exceed unpaid interest
      if (parseFloat(value) > unpaidInterest) {
        setError(
          `Amount cannot exceed unpaid interest of ₹${unpaidInterest.toFixed(
            2,
          )}`,
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
        `Amount cannot exceed unpaid interest of ₹${unpaidInterest.toFixed(2)}`,
      );
      return;
    }
    if (formData.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    const financialModes = ["cash", "cheque", "bank", "upi"];
    if (financialModes.includes(formData.mode) && !formData.paymentAccountId) {
      setError("Please select a transaction account.");
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
        <div className="modal-content shadow-lg border-0 rounded-4 animate-modal">
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
            <div
              className="modal-body p-4 overflow-auto"
              style={{ maxHeight: "70vh" }}
            >
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
                      {investor.interestRate} paise/month
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
                  <div
                    className="d-flex align-items-center bg-light rounded-2 px-2"
                    style={{ height: "38px", border: "1px solid #dee2e6" }}
                  >
                    <input
                      type="text"
                      className="form-control border-0 bg-transparent shadow-none p-0"
                      value={formData.month}
                      onChange={(e) => handleChange("month", e.target.value)}
                      required
                      style={{ fontSize: "0.9rem" }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Payment Date <span className="text-danger">*</span>
                  </label>
                  <div
                    className="d-flex align-items-center bg-light rounded-2 px-2"
                    style={{ height: "38px", border: "1px solid #dee2e6" }}
                  >
                    <input
                      type="date"
                      className="form-control border-0 bg-transparent shadow-none p-0"
                      value={formData.paidDate}
                      onChange={(e) => handleChange("paidDate", e.target.value)}
                      required
                      style={{ fontSize: "0.9rem" }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Interest Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <div
                    className="d-flex align-items-center bg-light rounded-2 px-2"
                    style={{
                      height: "45px",
                      border: `1px solid ${error ? "#dc3545" : "#dee2e6"}`,
                    }}
                  >
                    <span className="text-muted fw-bold me-2">₹</span>
                    <input
                      type="number"
                      className="form-control border-0 bg-transparent shadow-none p-0 fw-bold"
                      value={formData.amount}
                      onChange={(e) =>
                        handleChange("amount", parseFloat(e.target.value))
                      }
                      required
                      min="0"
                      max={unpaidInterest}
                      step="0.01"
                      style={{ fontSize: "1.1rem" }}
                    />
                  </div>
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
                    <option value="cheque">Cheque</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="products">Products/Services</option>
                    <option value="reinvest">
                      Reinvest (Add to Principal)
                    </option>
                  </select>
                </div>

                {/* Company Account Selector (Paid From) */}
                {(formData.mode === "cash" ||
                  formData.mode === "cheque" ||
                  formData.mode === "bank" ||
                  formData.mode === "upi") && (
                  <div className="col-md-12">
                    <label className="form-label fw-bold small">
                      Paid From Account <span className="text-danger">*</span>
                    </label>
                    <div className="d-grid gap-2 d-md-flex mb-2">
                      {accounts.map((acc) => (
                        <button
                          key={acc._id}
                          type="button"
                          onClick={() =>
                            handleChange("paymentAccountId", acc._id)
                          }
                          className={`btn btn-sm flex-fill fw-bold py-2 transition-all ${
                            formData.paymentAccountId === acc._id
                              ? "btn-success shadow border-0"
                              : "btn-light border text-secondary hover-shadow"
                          }`}
                        >
                          {acc.type === "Upi" ? (
                            <span>
                              <i className="bi bi-qr-code me-1"></i>UPI
                            </span>
                          ) : acc.type === "Credits" ||
                            acc.type === "Credit" ? (
                            <span>
                              <i className="bi bi-person-badge me-1"></i>CREDIT
                            </span>
                          ) : (
                            <span>
                              <i className="bi bi-cash me-1"></i>
                              {acc.type}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Dynamic Reference Field */}
                {(formData.mode === "cheque" ||
                  formData.mode === "bank" ||
                  formData.mode === "upi") && (
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      {formData.mode === "cheque"
                        ? "Cheque Number"
                        : "Transaction ID / Ref No"}
                      {formData.mode === "cheque" && (
                        <span className="text-danger">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.reference || ""}
                      onChange={(e) =>
                        handleChange("reference", e.target.value)
                      }
                      placeholder={
                        formData.mode === "cheque"
                          ? "Enter cheque number"
                          : "Optional reference"
                      }
                      required={formData.mode === "cheque"}
                    />
                  </div>
                )}

                {/* Bank Account Selection for Interest Payment */}
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
                                  (b) => b.id === selectedBankId,
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

                {/* UPI Account Selection for Interest Payment */}
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
                                  (u) => u.id === selectedUpiId,
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
