import React from "react";

const InvestorDetailsModal = ({
  isOpen,
  onClose,
  investor,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !investor) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2050" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header bg-primary text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-person-circle me-2"></i>
              Investor Details - {investor.name}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-4">
            {/* Investor Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-info-circle me-2"></i>Personal Information
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <small className="text-muted">Name:</small>
                    <div className="fw-bold">{investor.name}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Phone:</small>
                    <div className="fw-bold">{investor.phone}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Email:</small>
                    <div className="fw-bold">{investor.email || "N/A"}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Status:</small>
                    <div>
                      <span
                        className={`badge ${
                          investor.status === "active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {investor.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Start Date:</small>
                    <div className="fw-bold">
                      {new Date(investor.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Last Interest Paid:</small>
                    <div className="fw-bold">
                      {investor.lastInterestPaid
                        ? new Date(
                            investor.lastInterestPaid
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC & Banking Details */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-bank me-2"></i>KYC & Banking Details
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <small className="text-muted">Investor Type:</small>
                    <div className="fw-bold text-capitalize">
                      {investor.investorType || "Individual"}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">PAN Number:</small>
                    <div className="fw-bold font-monospace">
                      {investor.panNumber || "N/A"}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">KYC Status:</small>
                    <div>
                      <span
                        className={`badge ${
                          investor.kycStatus === "verified"
                            ? "bg-success"
                            : investor.kycStatus === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                        }`}
                      >
                        {(investor.kycStatus || "pending").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Preferred Payout Mode:</small>
                    <div className="fw-bold text-capitalize">
                      {investor.preferredPayoutMode || "Cash"}
                    </div>
                  </div>
                  {investor.preferredPayoutMode === "bank" &&
                    investor.bankDetails && (
                      <>
                        <div className="col-md-12">
                          <hr className="my-2 text-muted opacity-25" />
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Bank Name:</small>
                          <div className="fw-bold">
                            {investor.bankDetails.bankName || "N/A"}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Account Holder:</small>
                          <div className="fw-bold">
                            {investor.bankDetails.accountHolderName || "N/A"}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Account Number:</small>
                          <div className="fw-bold font-monospace">
                            {investor.bankDetails.accountNumber || "N/A"}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">IFSC Code:</small>
                          <div className="fw-bold font-monospace">
                            {investor.bankDetails.ifsc || "N/A"}
                          </div>
                        </div>
                      </>
                    )}
                  {investor.preferredPayoutMode === "upi" &&
                    investor.upiDetails && (
                      <>
                        <div className="col-md-12">
                          <hr className="my-2 text-muted opacity-25" />
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted">UPI ID:</small>
                          <div className="fw-bold font-monospace">
                            {investor.upiDetails.upiId || "N/A"}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted">UPI Phone:</small>
                          <div className="fw-bold font-monospace">
                            {investor.upiDetails.upiPhone || "N/A"}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-cash-stack me-2"></i>Investment Details
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <small className="text-muted">Principal Amount:</small>
                    <div className="fw-bold text-success fs-5">
                      ₹{investor.principalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Interest Rate:</small>
                    <div className="fw-bold text-primary fs-5">
                      {investor.interestRate}% p.a.
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Interest Type:</small>
                    <div className="fw-bold text-info fs-5">
                      {investor.interestType === "simple"
                        ? "Simple"
                        : "Compound"}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Default Payment Mode:</small>
                    <div className="fw-bold text-warning fs-5">
                      {investor.paymentMode.charAt(0).toUpperCase() +
                        investor.paymentMode.slice(1)}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Total Interest Paid:</small>
                    <div className="fw-bold text-danger fs-5">
                      ₹{investor.totalInterestPaid.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Current Value:</small>
                    <div className="fw-bold text-success fs-5">
                      ₹
                      {(
                        investor.principalAmount + investor.totalInterestPaid
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest History */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-clock-history me-2"></i>Interest Payment
                  History ({investor.interestHistory.length} payments)
                </h6>
              </div>
              <div className="card-body p-0">
                {investor.interestHistory.length > 0 ? (
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
                        {investor.interestHistory.map((payment, index) => (
                          <tr key={payment.id}>
                            <td className="fw-bold text-muted">{index + 1}</td>
                            <td>{payment.month}</td>
                            <td className="fw-bold text-success">
                              ₹{payment.amount.toLocaleString()}
                            </td>
                            <td>
                              {new Date(payment.paidDate).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  payment.mode === "cash"
                                    ? "bg-success"
                                    : payment.mode === "products"
                                    ? "bg-info"
                                    : "bg-warning"
                                } bg-opacity-10 text-${
                                  payment.mode === "cash"
                                    ? "success"
                                    : payment.mode === "products"
                                    ? "info"
                                    : "warning"
                                }`}
                              >
                                {payment.mode}
                              </span>
                            </td>
                            <td>{payment.products || payment.notes || "—"}</td>
                            <td>
                              <span className="badge bg-success">
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                    <p>No interest payments recorded yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payout History */}
            {investor.payoutHistory && investor.payoutHistory.length > 0 && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0 fw-bold">
                    <i className="bi bi-arrow-down-circle me-2"></i>Payout
                    History ({investor.payoutHistory.length} payouts)
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
                          <tr key={payout.id}>
                            <td className="fw-bold text-muted">{index + 1}</td>
                            <td>
                              {new Date(payout.date).toLocaleDateString()}
                            </td>
                            <td className="fw-bold text-danger">
                              ₹{payout.amount.toLocaleString()}
                            </td>
                            <td className="text-capitalize">{payout.type}</td>
                            <td className="text-capitalize">{payout.mode}</td>
                            <td className="font-monospace small">
                              {payout.reference || "—"}
                            </td>
                            <td>
                              <span className="badge bg-success">
                                {payout.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer border-top-0 bg-light rounded-bottom-4 d-flex justify-content-between">
            <div>
              <button
                type="button"
                className="btn btn-outline-danger fw-bold me-2"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this investor?"
                    )
                  ) {
                    onDelete(investor.id);
                    onClose();
                  }
                }}
              >
                <i className="bi bi-trash me-2"></i>Delete
              </button>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-warning fw-bold me-2 text-dark"
                onClick={() => {
                  onEdit(investor);
                  onClose();
                }}
              >
                <i className="bi bi-pencil me-2"></i>Edit
              </button>
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
    </div>
  );
};

export default InvestorDetailsModal;
