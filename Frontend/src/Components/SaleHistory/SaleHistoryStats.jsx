import React from "react";

const SaleHistoryStats = ({ data, totalInvestment = 0 }) => {
  // Revenue is now tracked by paidAmount on every sale (including partial credit payments)
  // Sales card displays the Net Revenue (Total bill value minus total value of items returned)
  // This matches the "Total Amount" column displayed in the transaction table.
  const totalRevenue = (data || []).reduce((sum, item) => {
    // Skip cancelled transactions entirely
    if (item.status === "Cancelled") return sum;

    let grossAmount = Number(item.amount || 0);

    // For Pending sales (Credits) or specific 'Credits' mode transactions that aren't fully paid,
    // we should only count the actual 'paidAmount' towards realized revenue.
    // We check for 'Pending' status which usually indicates unfinished payment for credits.
    if (item.status === "Pending" || item.paymentMode === "Credits") {
      grossAmount = Number(item.paidAmount || 0);
    }

    const r = Number(item.totalRefundedAmount || 0);
    const net = grossAmount - r;
    return sum + (isNaN(net) ? 0 : net);
  }, 0);

  // Total Refunded displays the actual cash returned to customers ("handed in hand")
  // This avoids double-counting credit settlements or adjustments as cash outflows.
  const totalRefunded = (data || []).reduce((sum, item) => {
    return sum + Number(item.cashRefundAmount || 0);
  }, 0);

  const countActiveSales = data.filter(
    (item) => item.status !== "Refunded" && item.status !== "Cancelled",
  );
  const totalTransactions = countActiveSales.length;
  const averageValue =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="row g-3 mb-4">
      {/* Total Revenue */}
      <div className="col-md">
        <div className="bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-10 d-flex align-items-center gap-3 h-100">
          <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-4">
            <i className="bi bi-currency-rupee fs-4"></i>
          </div>
          <div>
            <p className="text-muted small mb-1 fw-bold text-uppercase">
              Sales{" "}
            </p>
            <h4 className="fw-bold mb-0 text-dark">
              ₹{totalRevenue.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Total Refunded */}
      <div className="col-md">
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
      <div className="col-md">
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
      <div className="col-md">
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

      {/* Total Investment */}
      <div className="col-md">
        <div className="bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-10 d-flex align-items-center gap-3 h-100">
          <div className="bg-info bg-opacity-10 text-info p-3 rounded-4">
            <i className="bi bi-cash-stack fs-4"></i>
          </div>
          <div>
            <p className="text-muted small mb-1 fw-bold text-uppercase">
              Investment
            </p>
            <h4 className="fw-bold mb-0 text-dark">
              ₹{totalInvestment.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleHistoryStats;
