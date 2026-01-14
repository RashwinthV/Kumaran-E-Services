import React, { useState, useMemo } from "react";

const InvestorHistoryModal = ({ isOpen, onClose, investors }) => {
  const [selectedInvestorId, setSelectedInvestorId] = useState(
    investors.length > 0 ? investors[0].id : ""
  );
  const [interestPage, setInterestPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const itemsPerPage = 5;

  const selectedInvestor = useMemo(() => {
    return investors.find((inv) => inv.id === parseInt(selectedInvestorId));
  }, [investors, selectedInvestorId]);

  // Interest History Pagination
  const interestHistory = useMemo(() => {
    if (!selectedInvestor || !selectedInvestor.interestHistory) return [];
    return [...selectedInvestor.interestHistory].sort(
      (a, b) => new Date(b.paidDate) - new Date(a.paidDate)
    );
  }, [selectedInvestor]);

  const totalInterestPages = Math.ceil(interestHistory.length / itemsPerPage);
  const paginatedInterest = useMemo(() => {
    const start = (interestPage - 1) * itemsPerPage;
    return interestHistory.slice(start, start + itemsPerPage);
  }, [interestHistory, interestPage]);

  // Payout History Pagination
  const payoutHistory = useMemo(() => {
    if (!selectedInvestor || !selectedInvestor.payoutHistory) return [];
    return [...selectedInvestor.payoutHistory].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [selectedInvestor]);

  const totalPayoutPages = Math.ceil(payoutHistory.length / itemsPerPage);
  const paginatedPayout = useMemo(() => {
    const start = (payoutPage - 1) * itemsPerPage;
    return payoutHistory.slice(start, start + itemsPerPage);
  }, [payoutHistory, payoutPage]);

  if (!isOpen) return null;

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;
    return (
      <nav className="mt-3">
        <ul className="pagination pagination-sm justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link rounded-circle mx-1"
              onClick={() => onPageChange(currentPage - 1)}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {[...Array(totalPages)].map((_, i) => (
            <li
              key={i}
              className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
            >
              <button
                className="page-link rounded-circle mx-1 fw-bold"
                onClick={() => onPageChange(i + 1)}
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </button>
            </li>
          ))}
          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link rounded-circle mx-1"
              onClick={() => onPageChange(currentPage + 1)}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2050" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-4 animate-modal">
          <div className="modal-header bg-dark text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-clock-history me-2"></i>
              Investor Transaction Ledger
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-4">
            {/* Investor Selection */}
            <div className="card border-0 shadow-sm mb-4 bg-light">
              <div className="card-body py-3">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted mb-1">
                      Filter by Investor
                    </label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={selectedInvestorId}
                      onChange={(e) => {
                        setSelectedInvestorId(e.target.value);
                        setInterestPage(1);
                        setPayoutPage(1);
                      }}
                    >
                      {investors.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedInvestor && (
                    <div className="col-md-8 text-end">
                      <span className="badge bg-primary me-2 px-3 py-2">
                        Principal: ₹
                        {selectedInvestor.principalAmount.toLocaleString()}
                      </span>
                      <span className="badge bg-success px-3 py-2">
                        Total Paid: ₹
                        {selectedInvestor.totalInterestPaid.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedInvestor ? (
              <>
                {/* Interest History Table */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold text-primary">
                      <i className="bi bi-cash-coin me-2"></i>
                      Interest Payment History
                    </h6>
                    <span className="badge bg-primary bg-opacity-10 text-primary">
                      {interestHistory.length} Records
                    </span>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Paid Date</th>
                            <th>Mode</th>
                            <th>Details</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedInterest.length > 0 ? (
                            paginatedInterest.map((payment, index) => (
                              <tr key={payment.id}>
                                <td className="text-muted small">
                                  {(interestPage - 1) * itemsPerPage +
                                    index +
                                    1}
                                </td>
                                <td className="fw-bold">{payment.month}</td>
                                <td className="text-success fw-bold">
                                  ₹{payment.amount.toLocaleString()}
                                </td>
                                <td>
                                  {new Date(
                                    payment.paidDate
                                  ).toLocaleDateString()}
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark text-capitalize border">
                                    {payment.mode}
                                  </span>
                                </td>
                                <td className="small">
                                  {payment.products || payment.notes || "—"}
                                </td>
                                <td>
                                  <span className="badge bg-success bg-opacity-10 text-success">
                                    {payment.status || "Paid"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-4 text-muted"
                              >
                                No interest payments recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-0 py-2">
                    {renderPagination(
                      interestPage,
                      totalInterestPages,
                      setInterestPage
                    )}
                  </div>
                </div>

                {/* Payout History Table */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold text-danger">
                      <i className="bi bi-arrow-down-circle me-2"></i>
                      Principal Payout History
                    </h6>
                    <span className="badge bg-danger bg-opacity-10 text-danger">
                      {payoutHistory.length} Records
                    </span>
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
                          {paginatedPayout.length > 0 ? (
                            paginatedPayout.map((payout, index) => (
                              <tr key={payout.id}>
                                <td className="text-muted small">
                                  {(payoutPage - 1) * itemsPerPage + index + 1}
                                </td>
                                <td>
                                  {new Date(payout.date).toLocaleDateString()}
                                </td>
                                <td className="text-danger fw-bold">
                                  ₹{payout.amount.toLocaleString()}
                                </td>
                                <td className="text-capitalize">
                                  {payout.type}
                                </td>
                                <td className="text-capitalize">
                                  {payout.mode}
                                </td>
                                <td className="font-monospace small">
                                  {payout.reference || "—"}
                                </td>
                                <td>
                                  <span className="badge bg-success bg-opacity-10 text-success">
                                    {payout.status || "Paid"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-4 text-muted"
                              >
                                No principal payouts recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-0 py-2">
                    {renderPagination(
                      payoutPage,
                      totalPayoutPages,
                      setPayoutPage
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                Select an investor to view history
              </div>
            )}
          </div>
          <div className="modal-footer bg-light rounded-bottom-4">
            <button
              type="button"
              className="btn btn-secondary fw-bold px-4"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorHistoryModal;
