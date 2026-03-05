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
  if (
    reportType === "sales" ||
    reportType === "branch-performance" ||
    reportType === "gst"
  ) {
    const isGstReport = reportType === "gst";

    // Flatten data for GST report (one row per item)
    const gstData = isGstReport
      ? data.flatMap((sale) =>
          (sale.items || [])
            .filter((item) => (item.taxAmount || 0) > 0)
            .map((item) => ({
              ...item,
              gstBillNo: sale.gstBillNo || "N/A",
              date: sale.date,
              formattedDate: sale.formattedDate || formatDate(sale.date),
              customerName: sale.customerName,
              taxableVal:
                item.taxableValue || item.lineTotal - (item.taxAmount || 0),
              cgst: (item.taxAmount || 0) / 2,
              sgst: (item.taxAmount || 0) / 2,
            })),
        )
      : [];

    const tableData = isGstReport ? gstData : paginatedData;

    // GST Totals
    const gstTotals = isGstReport
      ? gstData.reduce(
          (acc, item) => ({
            taxable: acc.taxable + item.taxableVal,
            cgst: acc.cgst + item.cgst,
            sgst: acc.sgst + item.sgst,
            total: acc.total + item.lineTotal,
          }),
          { taxable: 0, cgst: 0, sgst: 0, total: 0 },
        )
      : null;

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
                  : reportType === "gst"
                    ? "Search by GST Bill No, Customer..."
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
                  <th>CP</th>
                  <th>Profit/Loss</th>
                  <th>Amount</th>
                  <th>Field Service</th>
                  <th>Status</th>
                </tr>
              ) : reportType === "gst" ? (
                <tr>
                  <th>GST Bill No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Product/Service</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th className="text-end">Taxable Value</th>
                  <th className="text-end">CGST</th>
                  <th className="text-end">SGST</th>
                  <th className="text-end">Total Amount</th>
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
              {(isGstReport ? tableData : paginatedData).length > 0 ? (
                (isGstReport ? tableData : paginatedData).map((row, index) => (
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
                        <td className="text-secondary fw-bold">
                          {formatCurrency(row.totalCP)}
                        </td>
                        <td
                          className={`fw-bold ${
                            row.totalProfit >= 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {formatCurrency(row.totalProfit)}
                        </td>
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
                    ) : reportType === "gst" ? (
                      <>
                        <td className="fw-bold text-primary">
                          {row.gstBillNo}
                        </td>
                        <td>{row.formattedDate}</td>
                        <td>{row.customerName}</td>
                        <td style={{ maxWidth: "250px" }}>{row.name}</td>
                        <td>{row.qty}</td>
                        <td>{formatCurrency(row.price)}</td>
                        <td className="text-end fw-bold">
                          {formatCurrency(row.taxableVal)}
                        </td>
                        <td className="text-end text-secondary">
                          {formatCurrency(row.cgst)}
                        </td>
                        <td className="text-end text-secondary">
                          {formatCurrency(row.sgst)}
                        </td>
                        <td className="text-end fw-bold text-dark">
                          {formatCurrency(row.lineTotal)}
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
                  <td
                    colSpan={
                      reportType === "sales"
                        ? "10"
                        : reportType === "gst"
                          ? "10"
                          : "3"
                    }
                  >
                    <div className="empty-state">
                      <i className="bi bi-clipboard-x"></i>
                      <p>No records found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {isGstReport && gstData.length > 0 && (
              <tfoot className="table-light">
                <tr
                  className="fw-bold"
                  style={{ borderTop: "2px solid #dee2e6" }}
                >
                  <td colSpan="6" className="text-end">
                    TOTALS:
                  </td>
                  <td className="text-end text-primary">
                    {formatCurrency(gstTotals.taxable)}
                  </td>
                  <td className="text-end text-secondary">
                    {formatCurrency(gstTotals.cgst)}
                  </td>
                  <td className="text-end text-secondary">
                    {formatCurrency(gstTotals.sgst)}
                  </td>
                  <td
                    className="text-end text-success"
                    style={{ fontSize: "1.1rem" }}
                  >
                    {formatCurrency(gstTotals.total)}
                  </td>
                </tr>
              </tfoot>
            )}
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
