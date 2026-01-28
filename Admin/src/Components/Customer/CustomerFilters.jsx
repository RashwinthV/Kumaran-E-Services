import React, { useEffect } from "react";
import { useBranch } from "../../Context/BranchContext";

const CustomerFilters = ({ filters, onFilterChange, onReset }) => {
  const { branches, getBranches } = useBranch();

  useEffect(() => {
    getBranches();
  }, [getBranches]);

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
          <div className="col-12 col-md-4">
            <div className="position-relative">
              <i
                className="bi bi-search position-absolute"
                style={{
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "1.1rem",
                }}
              ></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search customers..."
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
                style={{
                  paddingLeft: "3rem",
                  borderRadius: "12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  height: "48px",
                }}
              />
            </div>
          </div>

          <div className="col-12 col-md-8">
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-md-end">
              {/* Branch Filter */}
              <div className="d-flex align-items-center gap-2">
                <label
                  className="mb-0 fw-bold"
                  style={{ fontSize: "0.85rem", color: "#64748b" }}
                >
                  Branch:
                </label>
                <select
                  className="form-select"
                  value={filters.branch || "All"}
                  onChange={(e) => onFilterChange("branch", e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.85rem",
                    width: "140px",
                    height: "42px",
                    backgroundPosition: "right 0.75rem center",
                  }}
                >
                  <option value="All">All Branches</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="d-flex align-items-center gap-2">
                <label
                  className="mb-0 fw-bold"
                  style={{ fontSize: "0.85rem", color: "#64748b" }}
                >
                  Type:
                </label>
                <select
                  className="form-select"
                  value={filters.type || "All"}
                  onChange={(e) => onFilterChange("type", e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.85rem",
                    width: "140px",
                    height: "42px",
                    backgroundPosition: "right 0.75rem center",
                  }}
                >
                  <option value="All">All Types</option>
                  <option value="Credit">Credit</option>
                  <option value="NoCredit">No Credit</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="d-flex align-items-center gap-2">
                <label
                  className="mb-0 fw-bold"
                  style={{ fontSize: "0.85rem", color: "#64748b" }}
                >
                  Sort:
                </label>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => onFilterChange("sortBy", e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.85rem",
                    width: "160px",
                    height: "42px",
                    backgroundPosition: "right 0.75rem center",
                  }}
                >
                  <option value="NameAsc">Name (A-Z)</option>
                  <option value="NameDesc">Name (Z-A)</option>
                  <option value="CreditHighest">Credit (High-Low)</option>
                  <option value="CreditLowest">Credit (Low-High)</option>
                  <option value="RecentCredit">Recent activity</option>
                </select>
              </div>

              {/* Reset Button */}
              <button
                className="btn btn-primary px-3 fw-bold"
                onClick={onReset}
                style={{
                  borderRadius: "10px",
                  height: "42px",
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
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
