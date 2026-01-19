import React, { useState } from "react";

const ReportTable = ({ data, reportType }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();

    // Customize search based on report type if needed
    if (reportType === "branch-performance") {
      return item.branchName?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pages
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Common Layout for both reports
  if (reportType === "sales" || reportType === "branch-performance") {
    return (
      <div className="report-table-section">
        <div className="table-header-tools">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder={
                reportType === "sales"
                  ? "Search by Bill No, Customer, or Branch..."
                  : "Search by Branch Name..."
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
            />
          </div>
        </div>

        <div className="report-table-responsive">
          <table className="report-table">
            <thead>
              {reportType === "sales" ? (
                <tr>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Branch</th>
                  <th>Customer</th>
                  <th>Payment Mode</th>
                  <th>Amount</th>
                  <th>Field Service</th>
                  <th>Status</th>
                  <th>CP</th>
                  <th>profit/Loss</th>
                </tr>
              ) : (
                <tr>
                  <th>Branch Name</th>
                  <th>Total Bills</th>
                  <th>Total Sales</th>
                </tr>
              )}
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr key={index}>
                    {reportType === "sales" ? (
                      <>
                        <td>{row.formattedDate || formatDate(row.date)}</td>
                        <td>{row.billNumber}</td>
                        <td>{row.branchName}</td>
                        <td>
                          <div>{row.customerName}</div>
                          <small style={{ color: "#9ca3af" }}>
                            {row.customerPhone}
                          </small>
                        </td>
                        <td>{row.paymentMethod}</td>
                        <td>
                          <strong>{formatCurrency(row.amount)}</strong>
                        </td>
                        <td>{row.fieldService || "-"}</td>
                        <td>
                          {row.status ? (
                            <span
                              className={`status-capsule ${
                                row.status.toLowerCase() === "completed"
                                  ? "success"
                                  : "warning"
                              }`}
                            >
                              {row.status}
                            </span>
                          ) : (
                            <span className="status-capsule success">
                              Completed
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <strong>{row.branchName}</strong>
                        </td>
                        <td>{row.totalBills}</td>
                        <td>
                          <strong>{formatCurrency(row.totalSales)}</strong>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={reportType === "sales" ? "7" : "3"}>
                    <div className="empty-state">
                      <i className="bi bi-clipboard-x"></i>
                      <p>No records found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="d-flex flex-column align-items-center mt-3 px-2 gap-3">
            {/* <div className="text-secondary small">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div> */}
            <div className="d-flex gap-2 mb-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  return (
                    <React.Fragment key={page}>
                      {prevPage && page - prevPage > 1 && (
                        <span className="px-2 text-muted">...</span>
                      )}
                      <button
                        className={`btn btn-sm ${
                          currentPage === page
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div>Select a report type to view data</div>;
};

export default ReportTable;
