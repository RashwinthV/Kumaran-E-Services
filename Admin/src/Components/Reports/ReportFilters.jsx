import { useBranch } from "../../Context/BranchContext";
import { useEffect } from "react";

const ReportFilters = ({
  filters,
  onFilterChange,
  onExport,
  hideBranchSelector = false,
  availableTypes = [
    { value: "sales", label: "Sales Report" },
    { value: "branch-performance", label: "Branch Performance" },
  ],
}) => {
  const { branches, getBranches } = useBranch();

  useEffect(() => {
    getBranches();
  }, [getBranches]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <div
      className="bg-white p-4 rounded-4 shadow-sm border mb-4"
      style={{ borderColor: "rgba(0,0,0,0.05)" }}
    >
      <div className="row g-3">
        {/* Report Type */}
        <div className="col-md-3">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Report Type
          </label>
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="form-select form-select-sm bg-light border-0 shadow-none"
          >
            {availableTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="col-md-3">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Date Presets
          </label>
          <select
            name="dateRange"
            value={filters.dateRange}
            onChange={handleChange}
            className="form-select form-select-sm bg-light border-0 shadow-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Dates */}
        {filters.dateRange === "custom" && (
          <>
            <div className="col-md-2">
              <label
                className="form-label small text-muted fw-bold text-uppercase"
                style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
              >
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="form-control form-control-sm bg-light border-0 shadow-none"
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
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="form-control form-control-sm bg-light border-0 shadow-none"
              />
            </div>
          </>
        )}

        {/* Branch Selector */}
        {filters.type !== "branch-performance" && !hideBranchSelector && (
          <div className="col-md-3">
            <label
              className="form-label small text-muted fw-bold text-uppercase"
              style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
            >
              Branch Selection
            </label>
            <select
              name="branch"
              value={filters.branch}
              onChange={handleChange}
              className="form-select form-select-sm bg-light border-0 shadow-none"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bill Type Filter */}
        <div className="col-md-2">
          <label
            className="form-label small text-muted fw-bold text-uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
          >
            Transaction Type
          </label>
          <select
            name="billType"
            value={filters.billType}
            onChange={handleChange}
            className="form-select form-select-sm bg-light border-0 shadow-none"
          >
            <option value="all">All Types</option>
            <option value="products">Products Only</option>
            <option value="services">Services Only</option>
          </select>
        </div>

        {/* Export Action */}
        <div className="col d-flex align-items-end justify-content-end ms-auto">
          <button
            className="btn btn-sm btn-outline-primary px-4 fw-bold shadow-none"
            onClick={onExport}
            style={{ borderRadius: "8px" }}
          >
            <i className="bi bi-download me-2"></i>Export Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
