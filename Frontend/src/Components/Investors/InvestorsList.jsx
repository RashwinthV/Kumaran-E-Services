import React from "react";

const InvestorsList = ({
  investors,
  onEdit,
  onDelete,
  onPayInterest,
  onViewDetails,
  onBuyProducts,
  onPayoutPrincipal,
  calculatePendingInterest,
  calculateAccumulatedInterest,
  calculateUnpaidInterest,
}) => {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-list-ul me-2 text-primary"></i>
          Investors List
        </h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">#</th>
                <th>Investor Details</th>
                <th>Principal Amount</th>
                <th>Interest Rate</th>
                <th>Type</th>
                <th>Accumulated Interest</th>
                <th>Unpaid Interest</th>
                <th>Total Paid</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor, index) => (
                <tr key={investor.id}>
                  <td className="px-4 fw-bold text-muted">{index + 1}</td>
                  <td>
                    <div>
                      <div className="fw-bold text-dark">{investor.name}</div>
                      <small className="text-muted">
                        <i className="bi bi-telephone me-1"></i>
                        {investor.phone}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="fw-bold text-success">
                        ₹
                        {investor.currentPrincipal?.toLocaleString() ||
                          investor.principalAmount.toLocaleString()}
                      </span>
                      {investor.currentPrincipal !==
                        investor.principalAmount && (
                        <div>
                          <small className="text-muted">
                            (Original: ₹
                            {investor.principalAmount.toLocaleString()})
                          </small>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                      {investor.interestRate}% p.a.
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        investor.interestType === "simple"
                          ? "bg-info"
                          : "bg-warning"
                      } bg-opacity-10 text-${
                        investor.interestType === "simple" ? "info" : "warning"
                      } px-3 py-2`}
                    >
                      {investor.interestType === "simple"
                        ? "Simple"
                        : "Compound"}
                    </span>
                  </td>
                  <td>
                    <span className="fw-bold text-warning">
                      ₹{calculateAccumulatedInterest(investor).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className="fw-bold text-danger">
                      ₹{calculateUnpaidInterest(investor).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className="text-muted">
                      ₹{investor.totalInterestPaid.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        investor.status === "active"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {investor.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <button
                        className="btn btn-sm btn-light text-primary shadow-sm border"
                        onClick={() => onViewDetails(investor)}
                        title="View Details"
                        style={{
                          width: "32px",
                          height: "32px",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                        }}
                      >
                        <i className="bi bi-eye-fill"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-success shadow-sm border"
                        onClick={() => onPayInterest(investor)}
                        title="Pay Interest"
                        style={{
                          width: "32px",
                          height: "32px",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                        }}
                      >
                        <i className="bi bi-cash-coin"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-info shadow-sm border"
                        onClick={() => onBuyProducts(investor)}
                        title="Buy Products"
                        style={{
                          width: "32px",
                          height: "32px",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                        }}
                      >
                        <i className="bi bi-cart-fill"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-danger shadow-sm border"
                        onClick={() => onPayoutPrincipal(investor)}
                        title="Payout Principal"
                        style={{
                          width: "32px",
                          height: "32px",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                        }}
                      >
                        <i className="bi bi-cash-stack"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvestorsList;
