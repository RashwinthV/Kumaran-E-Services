import React from "react";

const InvestorDetailsModal = ({
  isOpen,
  onClose,
  investor,
  onEdit,
  onDelete,
  onCloseInvestment,
  onDownloadCertificate,
}) => {
  if (!isOpen || !investor) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-4 animate-modal">
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
          <div className="modal-body p-0">
            {/* Investor Information */}
            <div className="card border-0 shadow-none mb-0 rounded-0 border-bottom">
              <div className="card-header bg-white border-bottom-0 py-2">
                <h6 className="mb-0 fw-bold text-dark small">
                  <i className="bi bi-info-circle me-2"></i>Personal Information
                </h6>
              </div>
              <div className="card-body pt-0 pb-3">
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
                    <div className="d-flex gap-2">
                      <span
                        className={`badge ${
                          investor.status === "active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {investor.status}
                      </span>
                      {investor.isMatured && (
                        <span className="badge bg-info text-white">
                          Matured
                        </span>
                      )}
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
                            investor.lastInterestPaid,
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC & Banking Details */}
            <div className="card border-0 shadow-none mb-0 rounded-0 border-bottom">
              <div className="card-header bg-white border-bottom-0 py-2">
                <h6 className="mb-0 fw-bold text-dark small">
                  <i className="bi bi-bank me-2"></i>KYC & Banking Details
                </h6>
              </div>
              <div className="card-body pt-0 pb-3">
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
                    <small className="text-muted">Aadhar Number:</small>
                    <div className="fw-bold font-monospace">
                      {investor.aadharNumber || "N/A"}
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
                  {((investor.bankAccounts &&
                    investor.bankAccounts.length > 0) ||
                    (investor.bankDetails &&
                      investor.bankDetails.accountNumber)) && (
                    <>
                      <div className="col-md-12">
                        <hr className="my-2 text-muted opacity-25" />
                        <small className="text-muted fw-bold mb-2 d-block">
                          Bank Accounts:
                        </small>
                      </div>
                      {investor.bankAccounts &&
                      investor.bankAccounts.length > 0 ? (
                        investor.bankAccounts.map((bank, idx) => (
                          <div
                            key={bank.id || idx}
                            className="col-12 mb-2 border-bottom pb-2"
                          >
                            <div className="row g-2">
                              <div className="col-md-4">
                                <small className="text-muted">Bank Name:</small>
                                <div className="fw-bold">
                                  {bank.bankName || "N/A"}
                                </div>
                              </div>
                              <div className="col-md-4">
                                <small className="text-muted">
                                  Account Holder:
                                </small>
                                <div className="fw-bold">
                                  {bank.accountHolderName || "N/A"}
                                </div>
                              </div>
                              <div className="col-md-4">
                                <small className="text-muted">
                                  Account Number:
                                </small>
                                <div className="fw-bold font-monospace">
                                  {bank.accountNumber || "N/A"}
                                </div>
                              </div>
                              <div className="col-md-4">
                                <small className="text-muted">IFSC Code:</small>
                                <div className="fw-bold font-monospace">
                                  {bank.ifsc || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : investor.bankDetails ? (
                        <>
                          <div className="col-md-4">
                            <small className="text-muted">Bank Name:</small>
                            <div className="fw-bold">
                              {investor.bankDetails.bankName || "N/A"}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">
                              Account Holder:
                            </small>
                            <div className="fw-bold">
                              {investor.bankDetails.accountHolderName || "N/A"}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">
                              Account Number:
                            </small>
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
                      ) : (
                        <div className="col-12 text-muted fst-italic">
                          No bank details available.
                        </div>
                      )}
                    </>
                  )}
                  {((investor.upiAccounts && investor.upiAccounts.length > 0) ||
                    (investor.upiDetails && investor.upiDetails.upiId)) && (
                    <>
                      <div className="col-md-12">
                        <hr className="my-2 text-muted opacity-25" />
                        <small className="text-muted fw-bold mb-2 d-block">
                          UPI Accounts:
                        </small>
                      </div>
                      {investor.upiAccounts &&
                      investor.upiAccounts.length > 0 ? (
                        investor.upiAccounts.map((upi, idx) => (
                          <div
                            key={upi.id || idx}
                            className="col-12 mb-2 border-bottom pb-2"
                          >
                            <div className="row g-2">
                              <div className="col-md-6">
                                <small className="text-muted">UPI ID:</small>
                                <div className="fw-bold font-monospace">
                                  {upi.upiId || "N/A"}
                                </div>
                              </div>
                              <div className="col-md-6">
                                <small className="text-muted">UPI Phone:</small>
                                <div className="fw-bold font-monospace">
                                  {upi.upiPhone || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : investor.upiDetails ? (
                        <>
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
                      ) : (
                        <div className="col-12 text-muted fst-italic">
                          No UPI details available.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div className="card border-0 shadow-none mb-0 rounded-0 border-bottom">
              <div className="card-header bg-white border-bottom-0 py-2">
                <h6 className="mb-0 fw-bold text-dark small">
                  <i className="bi bi-cash-stack me-2"></i>Investment Details
                </h6>
              </div>
              <div className="card-body pt-0 pb-3">
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
                      {investor.interestRate} paise/₹1/m
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

            {/* Principal Deposits History */}
            {investor.investments && investor.investments.length > 0 && (
              <div className="card border-0 shadow-none mb-0 rounded-0">
                <div className="card-header bg-white border-bottom-0 py-2">
                  <h6 className="mb-0 fw-bold text-dark small">
                    <i className="bi bi-journal-plus me-2"></i>Principal History
                    (Deposits)
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-sm hover mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th className="px-3">Date</th>
                          <th>Amount</th>
                          <th>Maturity Status</th>
                          <th>Maturity Date</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investor.investments.map((inv, idx) => {
                          const depositDate = new Date(inv.date);
                          const maturityDate = new Date(depositDate);
                          maturityDate.setMonth(maturityDate.getMonth() + 1);

                          return (
                            <tr key={idx}>
                              <td className="px-3">
                                {depositDate.toLocaleDateString()}
                              </td>
                              <td className="fw-bold">
                                ₹{inv.amount.toLocaleString()}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    inv.isMatured
                                      ? "bg-success"
                                      : "bg-warning text-dark"
                                  }`}
                                >
                                  {inv.isMatured ? "Matured" : "Pending"}
                                </span>
                              </td>
                              <td className="small text-muted">
                                {maturityDate.toLocaleDateString()}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    inv.type === "initial"
                                      ? "bg-primary"
                                      : "bg-info"
                                  } bg-opacity-10 text-${
                                    inv.type === "initial" ? "primary" : "info"
                                  } text-capitalize`}
                                >
                                  {inv.type}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
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
                  onDelete(investor.id);
                  onClose();
                }}
              >
                <i className="bi bi-trash me-2"></i>Delete
              </button>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-info fw-bold me-2 text-white"
                onClick={() => onDownloadCertificate(investor)}
              >
                <i className="bi bi-file-earmark-pdf-fill me-2"></i>Download
                Certificate
              </button>
              {investor.status !== "closed" && (
                <button
                  type="button"
                  className="btn btn-outline-danger fw-bold me-2"
                  onClick={() => {
                    onCloseInvestment(investor);
                    onClose();
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i>Close Investment
                </button>
              )}
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
