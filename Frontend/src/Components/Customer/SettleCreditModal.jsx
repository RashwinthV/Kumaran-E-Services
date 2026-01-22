import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext";
import { API_ENDPOINTS } from "../../config/api";
import { toast } from "react-toastify";

const SettleCreditModal = ({ isOpen, onClose, customer, onSettle }) => {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [billAmounts, setBillAmounts] = useState({}); // { billId: amountString }
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Fetch branch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!isOpen || !accessToken) return;

      try {
        setLoadingAccounts(true);
        const res = await axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.data.success) {
          const validAccounts = res.data.data.filter(
            (acc) => acc.type !== "Credits"
          );
          setAccounts(validAccounts);

          const cashAcc = validAccounts.find((acc) => acc.type === "Cash");
          if (cashAcc) {
            setSelectedAccountId(cashAcc._id);
          } else if (validAccounts.length > 0) {
            setSelectedAccountId(validAccounts[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
        toast.error("Failed to load payment accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [isOpen, accessToken]);

  // Update settleAmount when selection or individual amounts change
  useEffect(() => {
    const total = Object.values(billAmounts).reduce(
      (sum, amt) => sum + (parseFloat(amt) || 0),
      0
    );
    setSettleAmount(total.toFixed(2));
  }, [billAmounts]);

  if (!isOpen || !customer) return null;

  const totalCreditAmount =
    customer.credits?.reduce((sum, credit) => sum + credit.totalAmount, 0) || 0;

  const handleSettle = async () => {
    const amount = parseFloat(settleAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select a payment account");
      return;
    }

    // Convert billAmounts to the format expected by the backend
    const itemSettlements = Object.entries(billAmounts)
      .filter(([_, amt]) => parseFloat(amt) > 0)
      .map(([id, amt]) => ({ id, amount: parseFloat(amt) }));

    setIsProcessing(true);
    try {
      await onSettle({
        amount,
        paymentMethod: selectedAccountId,
        itemSettlements,
        notes,
      });
      toast.success("Credit settled successfully");
      onClose();
      setSettleAmount("");
      setBillAmounts({});
      setNotes("");
      setSelectedBillIds([]);
    } catch (error) {
      console.error("Settlement error:", error);
      toast.error(error.message || "Failed to settle credit");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBill = (billId, fullAmount) => {
    setSelectedBillIds((prev) => {
      const isSelected = prev.includes(billId);
      if (isSelected) {
        // Deselect
        const { [billId]: _, ...rest } = billAmounts;
        setBillAmounts(rest);
        return prev.filter((id) => id !== billId);
      } else {
        // Select
        setBillAmounts((prevAmts) => ({
          ...prevAmts,
          [billId]: fullAmount.toFixed(2),
        }));
        return [...prev, billId];
      }
    });
  };

  const handleAmountChange = (billId, value, maxAmount) => {
    const amt = parseFloat(value);
    if (value !== "" && (isNaN(amt) || amt < 0)) return;
    if (amt > maxAmount) {
      toast.warning(`Maximum amount for this bill is ₹${maxAmount.toFixed(2)}`);
      setBillAmounts((prev) => ({ ...prev, [billId]: maxAmount.toFixed(2) }));
      return;
    }
    setBillAmounts((prev) => ({ ...prev, [billId]: value }));

    // Auto-select if not selected and amount > 0
    if (value !== "" && amt > 0 && !selectedBillIds.includes(billId)) {
      setSelectedBillIds((prev) => [...prev, billId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedBillIds.length === customer.credits.length) {
      setSelectedBillIds([]);
      setBillAmounts({});
    } else {
      const allIds = customer.credits.map((c) => c._id);
      const allAmts = {};
      customer.credits.forEach((c) => {
        allAmts[c._id] = c.totalAmount.toFixed(2);
      });
      setSelectedBillIds(allIds);
      setBillAmounts(allAmts);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 2040 }}
      ></div>

      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 2050 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden animate-modal">
            {/* Header */}
            <div className="modal-header bg-success bg-opacity-10 border-0 p-4">
              <div>
                <h5 className="modal-title fw-bold text-dark mb-1">
                  Settle Credit
                </h5>
                <p className="mb-0 small text-muted">
                  Customer:{" "}
                  <span className="fw-bold text-dark">{customer.name}</span>
                </p>
              </div>
              <button
                type="button"
                className="btn-close shadow-none"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body p-0">
              <div className="row g-0">
                {/* Left Side: Bill Selection */}
                <div className="col-lg-7 border-end">
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="small fw-bold text-uppercase text-muted mb-0">
                        Select Bills to Settle
                      </label>
                      <button
                        className="btn btn-sm btn-link text-decoration-none small p-0"
                        onClick={handleSelectAll}
                      >
                        {selectedBillIds.length === customer.credits.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    <div
                      className="credit-items-list pe-2"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      {customer.credits && customer.credits.length > 0 ? (
                        customer.credits.map((credit) => (
                          <div
                            key={credit._id}
                            className={`card mb-3 border-0 shadow-sm transition-all ${
                              selectedBillIds.includes(credit._id)
                                ? "bg-primary bg-opacity-10 border-start border-4 border-primary shadow"
                                : "bg-light hover-bg-light-dark border-start border-4 border-transparent"
                            }`}
                          >
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div
                                  className="form-check mb-0 cursor-pointer"
                                  onClick={() =>
                                    handleToggleBill(
                                      credit._id,
                                      credit.totalAmount
                                    )
                                  }
                                >
                                  <input
                                    className="form-check-input shadow-none"
                                    type="checkbox"
                                    checked={selectedBillIds.includes(
                                      credit._id
                                    )}
                                    readOnly
                                  />
                                  <label className="form-check-label small fw-bold text-dark cursor-pointer">
                                    {credit.billNumber || "N/A"}
                                  </label>
                                </div>
                                <span className="small text-muted">
                                  {formatDate(credit.date)}
                                </span>
                              </div>

                              {/* Products List */}
                              <div className="mb-3 ps-4">
                                <div className="d-flex flex-wrap gap-1">
                                  {credit.products?.map((p, i) => (
                                    <span
                                      key={i}
                                      className="badge bg-white text-dark border fw-normal small"
                                    >
                                      {typeof p === "object"
                                        ? p.name
                                        : "Product"}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="d-flex justify-content-between align-items-center ps-4">
                                <div
                                  className={`small ${
                                    credit.totalAmount < 0
                                      ? "text-success"
                                      : "text-muted"
                                  }`}
                                >
                                  {credit.totalAmount < 0
                                    ? "(Store Credit): "
                                    : "Total: "}
                                  <span className="fw-bold">
                                    ₹{Math.abs(credit.totalAmount).toFixed(2)}
                                  </span>
                                </div>
                                {credit.totalAmount > 0 && (
                                  <div className="input-group input-group-sm w-50">
                                    <span className="input-group-text bg-white border-end-0">
                                      ₹
                                
                                    <input
                                      type="number"
                                      className="form-control border-0 outline-0 text-end fw-bold"
                                      placeholder="0.00"
                                      value={billAmounts[credit._id] || ""}
                                      onChange={(e) =>
                                        handleAmountChange(
                                          credit._id,
                                          e.target.value,
                                          credit.totalAmount
                                        )
                                      }
                                      onFocus={(e) => e.target.select()}
                                      step="0.01"
                                      min="0"
                                    />
                                        </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-check2-circle display-4 d-block mb-2"></i>
                          No credits
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Settlement Form */}
                <div className="col-lg-5 bg-light bg-opacity-50">
                  <div className="p-4">
                    {/* Summary */}
                    <div className="bg-white rounded-4 p-4 mb-4 shadow-sm border border-light">
                      <span className="text-muted d-block small text-uppercase fw-bold mb-1">
                        Settlement Summary
                      </span>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">Amount to Pay</small>
                          <h2 className="fw-bold text-success mb-0">
                            ₹{parseFloat(settleAmount || 0).toFixed(2)}
                          </h2>
                        </div>
                        <div className="text-end mx-2">
                          <small className="text-muted d-block">
                            Total Credits
                          </small>
                          <span className="fw-bold text-danger">
                            ₹{totalCreditAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-light">
                        <small className="text-muted d-block">
                          Remaining Credit Balance
                        </small>
                        <span className="fw-bold text-muted">
                          ₹
                          {(
                            totalCreditAmount - parseFloat(settleAmount || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Account */}
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-uppercase text-muted">
                        Payment Account <span className="text-danger">*</span>
                      </label>
                      {loadingAccounts ? (
                        <div className="text-center py-2">
                          <div
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                          ></div>
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {accounts.map((acc) => (
                            <button
                              key={acc._id}
                              type="button"
                              className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 py-2 px-3 transition-all ${
                                selectedAccountId === acc._id
                                  ? "btn-primary shadow-sm"
                                  : "btn-outline-primary"
                              }`}
                              onClick={() => setSelectedAccountId(acc._id)}
                              disabled={
                                isProcessing || acc.currentStatus === "Closed"
                              }
                            >
                              <i
                                className={`bi ${
                                  acc.type === "Cash"
                                    ? "bi-cash-stack"
                                    : acc.type === "Upi"
                                    ? "bi-qr-code"
                                    : "bi-credit-card"
                                }`}
                              ></i>
                              <span className="small">
                                {acc.type === "Upi"
                                  ? acc.upiAccountName
                                  : acc.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-uppercase text-muted">
                        Notes
                      </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Optional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ resize: "none" }}
                      ></textarea>
                    </div>

                    {/* Action */}
                    <button
                      type="button"
                      className="btn btn-success w-100 py-3 fw-bold rounded-3 shadow-sm"
                      onClick={handleSettle}
                      disabled={
                        isProcessing || !settleAmount || loadingAccounts
                      }
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>Confirm
                          Settlement
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .credit-items-list::-webkit-scrollbar {
          width: 5px;
        }
        .credit-items-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .credit-items-list::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .credit-items-list::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
        .hover-bg-light-dark:hover {
          background-color: #f8f9fa !important;
          border-start-color: #dee2e6 !important;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default SettleCreditModal;
