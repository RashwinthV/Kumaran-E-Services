import React from "react";

const SaleHistoryFilters = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  availableYears,
}) => {
  return (
    <div className="bg-white p-4 rounded-4 shadow-sm border border-secondary border-opacity-10 mb-4">
      <div className="row g-3">
        {/* Search */}
        <div className="col-md-4">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Detailed Search
          </label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 ps-0 shadow-none"
              placeholder="Search Bill No, Customer..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
            />
          </div>
        </div>
        {/* Month */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Month
          </label>
          <select
            className="form-select form-select-sm bg-light shadow-none"
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

        {/* Year */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Year
          </label>
          <select
            className="form-select form-select-sm bg-light shadow-none"
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

        {/* Date Filters */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Start Date
          </label>
          <input
            type="date"
            className="form-control form-control-sm bg-light shadow-none"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            End Date
          </label>
          <input
            type="date"
            className="form-control form-control-sm bg-light shadow-none"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
          />
        </div>

        {/* Payment Mode */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Mode
          </label>
          <select
            className="form-select form-select-sm bg-light shadow-none"
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

        {/* Bill Type Filter */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Bill Type
          </label>
          <select
            className="form-select form-select-sm bg-light shadow-none"
            value={filters.billType}
            onChange={(e) => onFilterChange("billType", e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Products">Products Only</option>
            <option value="Services">Services Only</option>
          </select>
        </div>

        {/* Status */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Status
          </label>
          <select
            className="form-select form-select-sm bg-light shadow-none"
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

        {/* Sort By */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Sort By
          </label>
          <select
            className="form-select form-select-sm bg-light shadow-none"
            value={filters.sortBy}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
            <option value="Highest">Highest Amount</option>
            <option value="Lowest">Lowest Amount</option>
          </select>
        </div>

        {/* Export / Reset Actions */}
        <div className="col-md-6 d-flex align-items-end gap-2 justify-content-end ms-auto">
          <button
            className="btn btn-sm btn-outline-secondary px-3 fw-bold border-opacity-25 shadow-none"
            onClick={onExport}
          >
            <i className="bi bi-download me-2"></i>Export
          </button>
          <button
            className="btn btn-sm btn-outline-danger px-3 fw-bold border-opacity-25 shadow-none"
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
