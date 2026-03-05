const ReportStats = ({ stats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="report-stats-grid">
      <div className="report-stat-card">
        <div className="stat-icon-box blue">
          <i className="bi bi-cart3"></i>
        </div>
        <div className="stat-details">
          <h3>Total Sales</h3>
          <div className="value">{formatCurrency(stats.totalSales)}</div>
        </div>
      </div>

      <div className="report-stat-card">
        <div className="stat-icon-box green">
          <i className="bi bi-receipt"></i>
        </div>
        <div className="stat-details">
          <h3>Total Bills</h3>
          <div className="value">{stats.totalBills}</div>
        </div>
      </div>

      <div className="report-stat-card">
        <div className="stat-icon-box purple">
          <i className="bi bi-people"></i>
        </div>
        <div className="stat-details">
          <h3>Total Customers</h3>
          <div className="value">{stats.totalCustomers}</div>
        </div>
      </div>

      {/* Optional: Average Order Value */}
      <div className="report-stat-card">
        <div className="stat-icon-box orange">
          <i className="bi bi-graph-up-arrow"></i>
        </div>
        <div className="stat-details">
          <h3>Avg. Order Value</h3>
          <div className="value">
            {formatCurrency(
              stats.totalBills > 0 ? stats.totalSales / stats.totalBills : 0,
            )}
          </div>
        </div>
      </div>

      {stats.totalTaxable > 0 && (
        <>
          <div className="report-stat-card border-success">
            <div className="stat-icon-box green">
              <i className="bi bi-percent"></i>
            </div>
            <div className="stat-details">
              <h3>Total Taxable</h3>
              <div className="value text-success">
                {formatCurrency(stats.totalTaxable)}
              </div>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="stat-icon-box orange">
              <i className="bi bi-bank"></i>
            </div>
            <div className="stat-details">
              <h3>Total CGST</h3>
              <div className="value text-primary">
                {formatCurrency(stats.totalCGST)}
              </div>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="stat-icon-box orange">
              <i className="bi bi-bank"></i>
            </div>
            <div className="stat-details">
              <h3>Total SGST</h3>
              <div className="value text-primary">
                {formatCurrency(stats.totalSGST)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportStats;
