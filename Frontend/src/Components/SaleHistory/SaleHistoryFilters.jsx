import React from "react";

const SaleHistoryFilters = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  availableYears,
}) => {
  return (
    <div className="premium-card p-4 mb-4 border-0">
      <div className="row g-3">
        {/* Row 1: Search and Date/Time Context */}
        <div className="col-md-4">
          <label className="premium-form-label">Detailed Search</label>
          <div className="input-group">
            <span className="input-group-text bg-light border-0">
              <i className="bi bi-search "></i>

              <input
                type="text"
                className="form-control premium-input border-0 bg-light shadow-none"
                placeholder="Search Bill No, Customer..."
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
              />
            </span>
          </div>
        </div>

        <div className="col-md-2">
          <label className="premium-form-label">Month</label>
          <select
            className="form-select premium-input border-0 bg-light shadow-none"
            value={filters.month}
            onChange={(e) => onFilterChange("month", e.target.value)}
          >
            <option value="All">All Months</option>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((m, i) => (
              <option key={i} value={(i + 1).toString()}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <label className="premium-form-label">Year</label>
          <select
            className="form-select premium-input border-0 bg-light shadow-none"
            value={filters.year}
            onChange={(e) => onFilterChange("year", e.target.value)}
          >
            <option value="All">All Years</option>
            {availableYears?.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <label className="premium-form-label">Start Date</label>
          <input
            type="date"
            className="form-control premium-input border-0 bg-light shadow-none"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="premium-form-label">End Date</label>
          <input
            type="date"
            className="form-control premium-input border-0 bg-light shadow-none"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
          />
        </div>

        {/* Row 2: Categorical Filters and Sort */}
        <div className="col-md-2">
          <label className="premium-form-label">Mode</label>
          <select
            className="form-select premium-input border-0 bg-light shadow-none"
            value={filters.paymentMode}
            onChange={(e) => onFilterChange("paymentMode", e.target.value)}
          >
            <option value="All">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Credits">Credits</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="premium-form-label">Bill Type</label>
          <select
            className="form-select premium-input border-0 bg-light shadow-none"
            value={filters.billType}
            onChange={(e) => onFilterChange("billType", e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Products">Products</option>
            <option value="Services">Services</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="premium-form-label">Status</label>
          <select
            className="form-select premium-input border-0 bg-light shadow-none"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="Partially Refunded">Partially Refunded</option>
            <option value="Held">Held</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="premium-form-label">Sort By</label>
          <select
            className="form-select premium-input border-0 bg-light shadow-none"
            value={filters.sortBy}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
            <option value="Highest">Highest Amount</option>
            <option value="Lowest">Lowest Amount</option>
          </select>
        </div>

        {/* Actions */}
        <div className="col-md-4 d-flex align-items-end gap-2 justify-content-end">
          <button
            className="btn btn-light rounded-pill px-4 fw-bold shadow-sm"
            onClick={onExport}
          >
            <i className="bi bi-download me-2"></i>Export
          </button>
          <button
            className="btn btn-outline-danger rounded-pill px-4 fw-bold shadow-sm"
            onClick={onReset}
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleHistoryFilters;
