import React from "react";

const SaleHistoryStats = ({ data }) => {
  const totalRevenue = data.reduce(
    (sum, item) => sum + (item.amount - (item.totalRefundedAmount || 0)),
    0
  );
  const totalRefunded = data.reduce((sum, item) => {
    // If paymentMode is Credits, it's not a financial refund (no cash out)
    if (item.paymentMode === "Credits") return sum;
    return sum + (item.totalRefundedAmount || 0);
  }, 0);
  const totalTransactions = data.length;
  const averageValue =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="row g-3 mb-4">
      {/* Total Revenue */}
      <div className="col-md-3">
        <div className="bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-10 d-flex align-items-center gap-3 h-100">
          <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-4">
            <i className="bi bi-currency-rupee fs-4"></i>
          </div>
          <div>
            <p className="text-muted small mb-1 fw-bold text-uppercase">
              Net Revenue
            </p>
            <h4 className="fw-bold mb-0 text-dark">
              ₹{totalRevenue.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Total Refunded */}
      <div className="col-md-3">
        <div className="bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-10 d-flex align-items-center gap-3 h-100">
          <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-4">
            <i className="bi bi-arrow-counterclockwise fs-4"></i>
          </div>
          <div>
            <p className="text-muted small mb-1 fw-bold text-uppercase">
              Total Refunded
            </p>
            <h4 className="fw-bold mb-0 text-danger">
              ₹{totalRefunded.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="col-md-3">
        <div className="bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-10 d-flex align-items-center gap-3 h-100">
          <div className="bg-success bg-opacity-10 text-success p-3 rounded-4">
            <i className="bi bi-receipt fs-4"></i>
          </div>
          <div>
            <p className="text-muted small mb-1 fw-bold text-uppercase">
              Transactions
            </p>
            <h4 className="fw-bold mb-0 text-dark">{totalTransactions}</h4>
          </div>
        </div>
      </div>

      {/* Average Bill */}
      <div className="col-md-3">
        <div className="bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-10 d-flex align-items-center gap-3 h-100">
          <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-4">
            <i className="bi bi-graph-up-arrow fs-4"></i>
          </div>
          <div>
            <p className="text-muted small mb-1 fw-bold text-uppercase">
              Avg. Net Bill
            </p>
            <h4 className="fw-bold mb-0 text-dark">
              ₹{averageValue.toFixed(0)}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleHistoryStats;
