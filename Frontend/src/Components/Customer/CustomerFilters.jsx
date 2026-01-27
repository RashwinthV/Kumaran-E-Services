import React from "react";

const CustomerFilters = ({ filters, onFilterChange, onReset }) => {
  return (
    <div
      className="card shadow-sm border-0 mb-4"
      style={{
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        background: "#ffffff",
      }}
    >
      <div className="card-body p-4">
        <div className="row g-4 align-items-center">
          {/* Search Box */}
          <div className="col-12 col-md-5">
            <div
              className="bg-light rounded-2 px-3 d-flex align-items-center"
              style={{ height: "48px", border: "1px solid #e2e8f0" }}
            >
              <i className="bi bi-search text-muted fs-5 me-2"></i>
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none p-0"
                placeholder="Search customers..."
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
                style={{ fontSize: "1rem" }}
              />
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="d-flex flex-wrap gap-4 align-items-center justify-content-md-end">
              {/* Sort By Group */}
              <div className="d-flex align-items-center gap-3">
                <label
                  className="mb-0 fw-bold"
                  style={{ fontSize: "0.9rem", color: "#64748b" }}
                >
                  Sort By:
                </label>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => onFilterChange("sortBy", e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.9rem",
                    width: "180px",
                    height: "42px",
                    backgroundPosition: "right 0.75rem center",
                  }}
                >
                  <option value="NameAsc">Name (A-Z)</option>
                  <option value="NameDesc">Name (Z-A)</option>
                  <option value="CreditHighest">Credit (High to Low)</option>
                  <option value="CreditLowest">Credit (Low to High)</option>
                  <option value="RecentCredit">Recent Activity</option>
                </select>
              </div>

              {/* Reset Button */}
              <button
                className="btn btn-primary px-4 fw-bold"
                onClick={onReset}
                style={{
                  borderRadius: "10px",
                  height: "42px",
                  minWidth: "140px",
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFilters;
