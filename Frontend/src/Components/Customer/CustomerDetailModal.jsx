import React, { useState, useEffect } from "react";
import { useCustomer } from "../../Context/CustomerContext";

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  const { fetchCustomerPaymentHistory } = useCustomer();
  const [activeTab, setActiveTab] = useState("credits"); // 'credits' or 'payments'
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedCredit, setExpandedCredit] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    if (isOpen && customer && activeTab === "payments") {
      loadHistory();
    }
  }, [isOpen, customer, activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const data = await fetchCustomerPaymentHistory(customer._id);
    if (data && data.paymentHistory) {
      setPaymentHistory(data.paymentHistory);
    }
    setLoadingHistory(false);
  };

  if (!isOpen || !customer) return null;

  const totalCreditAmount =
    customer.credits?.reduce((sum, credit) => sum + credit.totalAmount, 0) || 0;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = (creditId) => {
    setExpandedCredit(expandedCredit === creditId ? null : creditId);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const clearDates = () => {
    setDateRange({ start: "", end: "" });
  };

  const filteredPayments = paymentHistory.filter((p) => {
    if (!dateRange.start && !dateRange.end) return true;
    const pDate = new Date(p.date);
    pDate.setHours(0, 0, 0, 0);

    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      if (pDate < start) return false;
    }

    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(0, 0, 0, 0);
      if (pDate > end) return false;
    }

    return true;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 2040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 2050 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            {/* Header */}
            <div className="modal-header bg-primary bg-opacity-10 border-0 p-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-person-badge text-primary fs-4"></i>
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    Customer Ledger
                  </h5>
                  <p className="mb-0 small text-muted">
                    {customer.name} • {customer.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close shadow-none"
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-0">
              {/* Summary Bar */}
              <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex gap-4">
                  <div>
                    <small
                      className="text-muted d-block text-uppercase fw-bold"
                      style={{ fontSize: "10px" }}
                    >
                      Total Credit
                    </small>
                    <span className="fw-bold text-danger fs-5">
                      ₹{totalCreditAmount.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <small
                      className="text-muted d-block text-uppercase fw-bold"
                      style={{ fontSize: "10px" }}
                    >
                      Active Bills
                    </small>
                    <span className="fw-bold text-dark fs-5">
                      {customer.credits?.length || 0}
                    </span>
                  </div>
                </div>

                <div className="btn-group btn-group-sm p-1 bg-white rounded-3 border">
                  <button
                    className={`btn px-3 border-0 rounded-2 ${
                      activeTab === "credits"
                        ? "btn-primary shadow-sm"
                        : "btn-light text-muted"
                    }`}
                    onClick={() => setActiveTab("credits")}
                  >
                    Pending Bills
                  </button>
                  <button
                    className={`btn px-3 border-0 rounded-2 ${
                      activeTab === "payments"
                        ? "btn-primary shadow-sm"
                        : "btn-light text-muted"
                    }`}
                    onClick={() => setActiveTab("payments")}
                  >
                    Payment History
                  </button>
                </div>
              </div>

              <div className="p-4" style={{ minHeight: "300px" }}>
                {activeTab === "credits" ? (
                  /* Outstanding Bills View */
                  <div>
                    {customer.credits && customer.credits.length > 0 ? (
                      <div className="list-group list-group-flush gap-3">
                        {customer.credits
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((credit) => {
                            const originalAmt =
                              credit.originalAmount || credit.totalAmount;
                            const paidAmt = originalAmt - credit.totalAmount;
                            const isExpanded = expandedCredit === credit._id;

                            return (
                              <div
                                key={credit._id}
                                className={`card border-0 shadow-sm rounded-3 overflow-hidden ${
                                  isExpanded ? "ring-1 ring-primary" : ""
                                }`}
                                style={{ border: "1px solid #eee" }}
                              >
                                <div
                                  className="card-body p-3 cursor-pointer"
                                  onClick={() => toggleExpand(credit._id)}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                      <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2 me-3">
                                        <i className="bi bi-receipt"></i>
                                      </div>
                                      <div>
                                        <div className="fw-bold text-dark mb-0">
                                          Bill #{credit.billNumber || "N/A"}
                                        </div>
                                        <small className="text-muted">
                                          {formatDate(credit.date)} •{" "}
                                          {formatTime(credit.date)}
                                        </small>
                                      </div>
                                    </div>
                                    <div className="text-end">
                                      <div className="text-muted small mb-0">
                                        Balance
                                      </div>
                                      <h5 className="fw-bold text-danger mb-0">
                                        ₹{credit.totalAmount.toFixed(2)}
                                      </h5>
                                    </div>
                                  </div>

                                  {/* Progress Bar for Partial Payments */}
                                  {paidAmt > 0 && (
                                    <div className="mt-3">
                                      <div className="d-flex justify-content-between small text-muted mb-1">
                                        <span>Paid: ₹{paidAmt.toFixed(2)}</span>
                                        <span>
                                          Total: ₹{originalAmt.toFixed(2)}
                                        </span>
                                      </div>
                                      <div
                                        className="progress"
                                        style={{ height: "6px" }}
                                      >
                                        <div
                                          className="progress-bar bg-success"
                                          role="progressbar"
                                          style={{
                                            width: `${
                                              (paidAmt / originalAmt) * 100
                                            }%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-2 d-flex justify-content-between align-items-center">
                                    <span className="badge bg-light text-dark border fw-normal">
                                      {credit.products?.length || 0} items
                                    </span>
                                    <small className="text-primary fw-bold">
                                      {isExpanded
                                        ? "Hide History"
                                        : "View Breakdown"}{" "}
                                      <i
                                        className={`bi bi-chevron-${
                                          isExpanded ? "up" : "down"
                                        } ms-1`}
                                      ></i>
                                    </small>
                                  </div>
                                </div>

                                {/* Expanded Payment History for this Bill */}
                                {isExpanded && (
                                  <div className="bg-light p-3 border-top">
                                    <h6 className="small fw-bold text-uppercase text-muted mb-3">
                                      Payments for this bill
                                    </h6>
                                    {credit.paymentHistory &&
                                    credit.paymentHistory.length > 0 ? (
                                      <div className="timeline-small">
                                        {credit.paymentHistory.map(
                                          (payment, pIndex) => (
                                            <div
                                              key={pIndex}
                                              className="d-flex mb-3 position-relative"
                                            >
                                              {pIndex !==
                                                credit.paymentHistory.length -
                                                  1 && (
                                                <div
                                                  className="position-absolute start-0 top-0 mt-3 h-100 border-start ms-2"
                                                  style={{ zIndex: 0 }}
                                                ></div>
                                              )}
                                              <div
                                                className="bg-success rounded-circle me-3 mt-1 shadow-sm d-flex align-items-center justify-content-center"
                                                style={{
                                                  width: "16px",
                                                  height: "16px",
                                                  zIndex: 1,
                                                }}
                                              >
                                                <i
                                                  className="bi bi-check text-white"
                                                  style={{ fontSize: "10px" }}
                                                ></i>
                                              </div>
                                              <div className="flex-fill">
                                                <div className="d-flex justify-content-between">
                                                  <span className="small fw-bold text-dark">
                                                    ₹{payment.amount.toFixed(2)}
                                                  </span>
                                                  <span className="small text-muted">
                                                    {formatDate(payment.date)}
                                                  </span>
                                                </div>
                                                <div className="small text-muted">
                                                  via{" "}
                                                  {payment.paymentMethodName ||
                                                    "Unknown"}
                                                  {payment.notes && (
                                                    <span className="ms-2 italic bg-white px-1 border rounded">
                                                      "{payment.notes}"
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <p className="small text-muted mb-0 italic">
                                        No payments recorded yet for this bill.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="bi bi-check-circle display-4 text-success mb-3"></i>
                        <h5>No Outstanding Credits</h5>
                        <p className="text-muted">
                          This customer has a clean record!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Full Payment History View */
                  <div>
                    {/* Date Filters */}
                    <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                      <div className="row g-2 align-items-end">
                        <div className="col-md-5">
                          <label
                            className="small fw-bold text-muted mb-1 d-block text-uppercase"
                            style={{ fontSize: "10px" }}
                          >
                            From Date
                          </label>
                          <input
                            type="date"
                            name="start"
                            className="form-control form-control-sm border-0 bg-light"
                            value={dateRange.start}
                            onChange={handleDateChange}
                          />
                        </div>
                        <div className="col-md-5">
                          <label
                            className="small fw-bold text-muted mb-1 d-block text-uppercase"
                            style={{ fontSize: "10px" }}
                          >
                            To Date
                          </label>
                          <input
                            type="date"
                            name="end"
                            className="form-control form-control-sm border-0 bg-light"
                            value={dateRange.end}
                            onChange={handleDateChange}
                          />
                        </div>
                        <div className="col-md-2">
                          <button
                            className="btn btn-sm btn-outline-secondary w-100 border-0"
                            onClick={clearDates}
                            disabled={!dateRange.start && !dateRange.end}
                          >
                            <i className="bi bi-x-circle me-1"></i> Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    {loadingHistory ? (
                      <div className="text-center py-5">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        ></div>
                        <p className="mt-2 text-muted">Loading history...</p>
                      </div>
                    ) : filteredPayments.length > 0 ? (
                      <div className="table-responsive rounded-3 border">
                        <table className="table table-hover mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="small border-0">Date</th>
                              <th className="small border-0">Bill #</th>
                              <th className="small border-0">Method</th>
                              <th className="small border-0 text-end">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPayments.map((payment, idx) => (
                              <tr key={idx}>
                                <td className="small align-middle">
                                  {formatDate(payment.date)}
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}
                                  >
                                    {formatTime(payment.date)}
                                  </div>
                                </td>
                                <td className="small align-middle fw-bold">
                                  {payment.billNumber || "N/A"}
                                </td>
                                <td className="small align-middle">
                                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10">
                                    {payment.paymentMethodName}
                                  </span>
                                </td>
                                <td className="small align-middle text-end fw-bold text-success">
                                  ₹{payment.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-5 text-muted">
                        <i className="bi bi-clock-history display-5 mb-2"></i>
                        <p>
                          {paymentHistory.length === 0
                            ? "No payment records found."
                            : "No payments match the selected date range."}
                        </p>
                        {(dateRange.start || dateRange.end) && (
                          <button
                            className="btn btn-link btn-sm"
                            onClick={clearDates}
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 bg-light">
              <button
                type="button"
                className="btn btn-secondary px-4 rounded-pill"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .ring-1 { box-shadow: 0 0 0 1px var(--bs-primary); }
        .timeline-small { border-left: none; }
        .italic { font-style: italic; }
      `}</style>
    </>
  );
};

export default CustomerDetailModal;
