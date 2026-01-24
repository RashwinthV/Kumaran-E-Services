import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../Context/AuthContext";

const InvestorHistoryModal = ({ isOpen, onClose, investors }) => {
  const { user } = useAuth();
  const [selectedInvestorId, setSelectedInvestorId] = useState(
    investors.length > 0 ? investors[0].id : "",
  );
  const [interestPage, setInterestPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const itemsPerPage = 5;

  const selectedInvestor = useMemo(() => {
    return investors.find(
      (inv) => String(inv.id) === String(selectedInvestorId),
    );
  }, [investors, selectedInvestorId]);

  // Interest History Pagination
  const interestHistory = useMemo(() => {
    if (!selectedInvestor || !selectedInvestor.interestHistory) return [];
    return [...selectedInvestor.interestHistory].sort(
      (a, b) => new Date(b.paidDate) - new Date(a.paidDate),
    );
  }, [selectedInvestor]);

  const totalInterestPages = Math.ceil(interestHistory.length / itemsPerPage);
  const paginatedInterest = useMemo(() => {
    const start = (interestPage - 1) * itemsPerPage;
    return interestHistory.slice(start, start + itemsPerPage);
  }, [interestHistory, interestPage]);

  // Payout History Pagination
  const payoutHistory = useMemo(() => {
    if (!selectedInvestor || !selectedInvestor.payoutHistory) return [];
    return [...selectedInvestor.payoutHistory].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }, [selectedInvestor]);

  const totalPayoutPages = Math.ceil(payoutHistory.length / itemsPerPage);
  const paginatedPayout = useMemo(() => {
    const start = (payoutPage - 1) * itemsPerPage;
    return payoutHistory.slice(start, start + itemsPerPage);
  }, [payoutHistory, payoutPage]);

  const downloadTransactionHistoryPDF = async () => {
    if (!selectedInvestor) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Load Logo
    const loadImg = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    const logoImg = await loadImg("/kes_logo.jpeg");

    // Header with sleek black background and rounded effect
    yPos = 15;
    doc.setFillColor(20, 20, 20); // Premium Deep Black
    doc.roundedRect(10, 8, pageWidth - 20, 48, 4, 4, "F");

    // Logo positioned in header
    if (logoImg) {
      doc.addImage(logoImg, "JPEG", 14, 10, 30, 30);
    }

    // Company/Branch Name - Adjusted for Logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    const logoOffset = logoImg ? 20 : 0;
    doc.text("KUMARAN E-SERVICES", pageWidth / 2 + logoOffset, 18, {
      align: "center",
    });

    // Branch Details
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    const branchText = user?.branchCode
      ? `Branch: ${user.branchCode}`
      : "Branch Office";
    doc.text(branchText, pageWidth / 2 + logoOffset, 28, { align: "center" });

    // Document Title
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("TRANSACTION HISTORY STATEMENT", pageWidth / 2 + logoOffset, 38, {
      align: "center",
    });

    // Generation Date
    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      pageWidth / 2 + logoOffset,
      45,
      { align: "center" },
    );

    yPos = 60;

    // Investor Details Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, yPos, pageWidth - 28, 32, 2, 2, "F");

    yPos += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text("INVESTOR DETAILS", 18, yPos);

    yPos += 7;
    doc.setFontSize(10);
    doc.setFont("times", "normal");

    // Two column layout for investor details
    const col1X = 18;
    const col2X = pageWidth / 2 + 5;

    doc.setFont("times", "bold");
    doc.text("Name:", col1X, yPos);
    doc.setFont("times", "normal");
    doc.text(selectedInvestor.name, col1X + 25, yPos);

    doc.setFont("times", "bold");
    doc.text("Phone:", col2X, yPos);
    doc.setFont("times", "normal");
    doc.text(selectedInvestor.phone, col2X + 25, yPos);

    yPos += 6;
    doc.setFont("times", "bold");
    doc.text("Principal:", col1X, yPos);
    doc.setFont("times", "normal");
    doc.text(
      `Rs. ${selectedInvestor.principalAmount?.toLocaleString("en-IN") || 0}`,
      col1X + 25,
      yPos,
    );

    doc.setFont("times", "bold");
    doc.text("Interest Rate:", col2X, yPos);
    doc.setFont("times", "normal");
    doc.text(
      `${selectedInvestor.interestRate || 0} paise/month`,
      col2X + 25,
      yPos,
    );

    yPos += 6;
    doc.setFont("times", "bold");
    doc.text("Type:", col1X, yPos);
    doc.setFont("times", "normal");
    doc.text(
      selectedInvestor.interestType === "simple"
        ? "Simple Interest"
        : "Compound Interest",
      col1X + 25,
      yPos,
    );

    doc.setFont("times", "bold");
    doc.text("Status:", col2X, yPos);
    doc.setFont("times", "normal");
    doc.text(
      selectedInvestor.status?.toUpperCase() || "ACTIVE",
      col2X + 25,
      yPos,
    );

    yPos += 12;

    // Interest Payment History
    if (interestHistory.length > 0) {
      doc.setFontSize(12);
      doc.setFont("times", "bold");
      doc.text("Interest Payment History", 14, yPos);
      yPos += 5;

      const interestTableData = interestHistory.map((payment, index) => [
        index + 1,
        payment.month || "-",
        `Rs. ${payment.amount?.toLocaleString() || 0}`,
        new Date(payment.paidDate).toLocaleDateString(),
        payment.mode || "-",
        payment.products ||
          payment.saleId?.billNumber ||
          payment.billNumber ||
          payment.reference ||
          payment.notes ||
          "-",
        payment.status || "paid",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Month", "Amount", "Date", "Mode", "Details", "Status"]],
        body: interestTableData,
        theme: "striped",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          font: "times",
          fontStyle: "bold",
        },
        styles: { fontSize: 8, font: "times" },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Principal Transaction History
    if (payoutHistory.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont("times", "bold");
      doc.text("Principal Transaction History", 14, yPos);
      yPos += 5;

      const payoutTableData = payoutHistory.map((payout, index) => [
        index + 1,
        new Date(payout.date).toLocaleDateString(),
        `Rs. ${payout.amount?.toLocaleString() || 0}`,
        payout.type || "-",
        payout.mode || "-",
        payout.reference || "-",
        payout.status || "completed",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Date", "Amount", "Type", "Mode", "Reference", "Status"]],
        body: payoutTableData,
        theme: "striped",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          font: "times",
          fontStyle: "bold",
        },
        styles: { fontSize: 8, font: "times" },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Summary Section - Redesigned
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = 20;
    }

    // Summary Header
    // Summary Header
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("FINANCIAL SUMMARY", 14, yPos + 7);

    yPos += 15;

    // Summary Items - Three Column Layout
    const colWidth = (pageWidth - 28) / 3;
    const summaryY = yPos;

    // Item 1: Total Interest Paid
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text("TOTAL INTEREST PAID", 14, summaryY, { align: "left" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text(
      `Rs. ${selectedInvestor.totalInterestPaid?.toLocaleString("en-IN") || 0}`,
      14,
      summaryY + 8,
      { align: "left" },
    );

    // Item 2: Unpaid Interest
    const sumCol2X = 14 + colWidth;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text("UNPAID INTEREST", sumCol2X, summaryY, { align: "left" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text(
      `Rs. ${selectedInvestor.unpaidInterest?.toFixed(2) || "0.00"}`,
      sumCol2X,
      summaryY + 8,
      { align: "left" },
    );

    // Item 3: Current Principal
    const sumCol3X = 14 + colWidth * 2;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text("CURRENT PRINCIPAL", sumCol3X, summaryY, { align: "left" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text(
      `Rs. ${selectedInvestor.currentPrincipal?.toLocaleString("en-IN") || selectedInvestor.principalAmount?.toLocaleString("en-IN") || 0}`,
      sumCol3X,
      summaryY + 8,
      { align: "left" },
    );

    yPos += 20;

    // Signature Section
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Signature Section - Line Removed
    yPos += 15;
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.text("Authorized Signature", pageWidth - 42, yPos, { align: "center" });
    yPos += 4;
    doc.text("(Owner/Manager)", pageWidth - 42, yPos, { align: "center" });

    // Save PDF
    doc.save(
      `${selectedInvestor.name}_Transaction_History_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
    );
  };

  if (!isOpen) return null;

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;
    return (
      <nav className="mt-3">
        <ul className="pagination pagination-sm justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link rounded-circle mx-1"
              onClick={() => onPageChange(currentPage - 1)}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {[...Array(totalPages)].map((_, i) => (
            <li
              key={i}
              className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
            >
              <button
                className="page-link rounded-circle mx-1 fw-bold"
                onClick={() => onPageChange(i + 1)}
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </button>
            </li>
          ))}
          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link rounded-circle mx-1"
              onClick={() => onPageChange(currentPage + 1)}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div
      className="modal show d-block d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2050" }}
    >
        <div className="modal-content shadow-lg border-0 rounded-4 animate-modal">
          <div className="modal-header bg-dark text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-clock-history me-2"></i>
              Investor Transaction Ledger
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-4">
            {/* Investor Selection */}
            <div className="card border-0 shadow-sm mb-4 bg-light">
              <div className="card-body py-3">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-muted mb-1">
                      Filter by Investor
                    </label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={selectedInvestorId}
                      onChange={(e) => {
                        setSelectedInvestorId(e.target.value);
                        setInterestPage(1);
                        setPayoutPage(1);
                      }}
                    >
                      {investors.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedInvestor && (
                    <div className="col-md-8 text-end">
                      <span className="badge bg-primary me-2 px-3 py-2">
                        Principal: Rs.
                        {selectedInvestor.principalAmount.toLocaleString()}
                      </span>
                      <span className="badge bg-success px-3 py-2">
                        Total Paid: Rs.
                        {selectedInvestor.totalInterestPaid.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedInvestor ? (
              <>
                {/* Interest History Table */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold text-primary">
                      <i className="bi bi-cash-coin me-2"></i>
                      Interest Payment History
                    </h6>
                    <span className="badge bg-primary bg-opacity-10 text-primary">
                      {interestHistory.length} Records
                    </span>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Paid Date</th>
                            <th>Mode</th>
                            <th>Details</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedInterest.length > 0 ? (
                            paginatedInterest.map((payment, index) => (
                              <tr key={payment.id}>
                                <td className="text-muted small">
                                  {(interestPage - 1) * itemsPerPage +
                                    index +
                                    1}
                                </td>
                                <td className="fw-bold">{payment.month}</td>
                                <td className="text-success fw-bold">
                                  Rs.{payment.amount.toLocaleString()}
                                </td>
                                <td>
                                  {new Date(
                                    payment.paidDate,
                                  ).toLocaleDateString()}
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark text-capitalize border">
                                    {payment.mode}
                                  </span>
                                </td>
                                <td className="small">
                                  {payment.products ||
                                    payment.saleId?.billNumber ||
                                    payment.billNumber ||
                                    payment.reference ||
                                    payment.notes ||
                                    "—"}
                                </td>
                                <td>
                                  <span className="badge bg-success bg-opacity-10 text-success">
                                    {payment.status || "Paid"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-4 text-muted"
                              >
                                No interest payments recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-0 py-2">
                    {renderPagination(
                      interestPage,
                      totalInterestPages,
                      setInterestPage,
                    )}
                  </div>
                </div>

                {/* Payout History Table */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold text-dark">
                      <i className="bi bi-arrow-left-right me-2"></i>
                      Principal Transaction History
                    </h6>
                    <span className="badge bg-danger bg-opacity-10 text-danger">
                      {payoutHistory.length} Records
                    </span>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Mode</th>
                            <th>Reference</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedPayout.length > 0 ? (
                            paginatedPayout.map((payout, index) => (
                              <tr key={payout.id}>
                                <td className="text-muted small">
                                  {(payoutPage - 1) * itemsPerPage + index + 1}
                                </td>
                                <td>
                                  {new Date(payout.date).toLocaleDateString()}
                                </td>
                                <td
                                  className={`fw-bold ${payout.type === "payin" ? "text-success" : "text-danger"}`}
                                >
                                  {payout.type === "payin" ? "+" : "-"}Rs.
                                  {payout.amount.toLocaleString()}
                                </td>
                                <td className="text-capitalize">
                                  {payout.type}
                                </td>
                                <td className="text-capitalize">
                                  {payout.mode}
                                </td>
                                <td className="font-monospace small">
                                  {payout.reference || "—"}
                                </td>
                                <td>
                                  <span className="badge bg-success bg-opacity-10 text-success">
                                    {payout.status || "Paid"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-4 text-muted"
                              >
                                No principal transactions recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-0 py-2">
                    {renderPagination(
                      payoutPage,
                      totalPayoutPages,
                      setPayoutPage,
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                Select an investor to view history
              </div>
            )}
          </div>
          <div className="modal-footer bg-light rounded-bottom-4">
            <button
              type="button"
              className="btn btn-primary fw-bold px-4"
              onClick={downloadTransactionHistoryPDF}
              disabled={!selectedInvestor}
            >
              <i className="bi bi-file-earmark-pdf-fill me-2"></i>
              Download PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary fw-bold px-4"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
  );
};

export default InvestorHistoryModal;
