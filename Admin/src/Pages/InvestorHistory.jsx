import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../Context/AuthContext";
import { useCustomer } from "../Context/CustomerContext";

const InvestorHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { investors, fetchInvestors, loading } = useCustomer();

  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [interestPage, setInterestPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchInvestors();
  }, []);

  // Map backend structure to frontend expectations (copied from Investors.jsx)
  const processedInvestors = useMemo(() => {
    return investors.flatMap((inv) => {
      const investments =
        inv.investmentDetails ||
        (inv.investorDetails ? [inv.investorDetails] : []);

      return investments.map((investment) => {
        const details = investment || {};
        const currentPrincipal =
          details.currentPrincipal === 0 &&
          (!details.payoutHistory || details.payoutHistory.length === 0)
            ? details.principalAmount
            : (details.currentPrincipal ?? details.principalAmount ?? 0);

        return {
          ...inv,
          id: details._id || inv._id,
          customerId: inv._id,
          investmentId: details.id || details._id,
          ...details,
          currentPrincipal,
          totalInterestPaid: details.totalInterestPaid || 0,
        };
      });
    });
  }, [investors]);

  useEffect(() => {
    if (processedInvestors.length > 0 && !selectedInvestorId) {
      setSelectedInvestorId(processedInvestors[0].id);
    }
  }, [processedInvestors, selectedInvestorId]);

  const selectedInvestor = useMemo(() => {
    return processedInvestors.find(
      (inv) => String(inv.id) === String(selectedInvestorId),
    );
  }, [processedInvestors, selectedInvestorId]);

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

    const loadImg = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    const logoImg = await loadImg("/kes_logo.jpeg");

    yPos = 15;
    doc.setFillColor(20, 20, 20);
    doc.roundedRect(10, 8, pageWidth - 20, 48, 4, 4, "F");

    if (logoImg) {
      doc.addImage(logoImg, "JPEG", 14, 10, 30, 30);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    const logoOffset = logoImg ? 20 : 0;
    doc.text("KUMARAN E-SERVICES", pageWidth / 2 + logoOffset, 18, {
      align: "center",
    });

    doc.setFontSize(11);
    doc.setFont("times", "normal");
    const branchText = user?.branchCode
      ? `Branch: ${user.branchCode}`
      : "Branch Office";
    doc.text(branchText, pageWidth / 2 + logoOffset, 28, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("TRANSACTION HISTORY STATEMENT", pageWidth / 2 + logoOffset, 38, {
      align: "center",
    });

    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-IN")} at ${new Date().toLocaleTimeString("en-IN")}`,
      pageWidth / 2 + logoOffset,
      45,
      { align: "center" },
    );

    yPos = 60;
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
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

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
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = 20;
    }
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("FINANCIAL SUMMARY", 14, yPos + 7);

    yPos += 15;
    const colWidth = (pageWidth - 28) / 3;
    const summaryY = yPos;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text("TOTAL INTEREST PAID", 14, summaryY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text(
      `Rs. ${selectedInvestor.totalInterestPaid?.toLocaleString("en-IN") || 0}`,
      14,
      summaryY + 8,
    );

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text("UNPAID INTEREST", 14 + colWidth, summaryY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text(
      `Rs. ${selectedInvestor.unpaidInterest?.toFixed(2) || "0.00"}`,
      14 + colWidth,
      summaryY + 8,
    );

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text("CURRENT PRINCIPAL", 14 + colWidth * 2, summaryY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text(
      `Rs. ${selectedInvestor.currentPrincipal?.toLocaleString("en-IN") || 0}`,
      14 + colWidth * 2,
      summaryY + 8,
    );

    yPos += 30;
    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.text("Authorized Signature", pageWidth - 42, yPos, { align: "center" });

    doc.save(
      `${selectedInvestor.name}_History_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
    );
  };

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;
    return (
      <nav className="mt-3">
        <ul className="pagination pagination-sm justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link shadow-none"
              onClick={() => onPageChange(currentPage - 1)}
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
                className="page-link shadow-none"
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </button>
            </li>
          ))}
          <li
            className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
          >
            <button
              className="page-link shadow-none"
              onClick={() => onPageChange(currentPage + 1)}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            className="btn btn-link text-decoration-none p-0 mb-2 text-primary fw-bold"
            onClick={() => navigate("/investors")}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Investors
          </button>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-clock-history text-primary me-2"></i>
            Investor Transaction Ledger
          </h2>
          <p className="text-muted mb-0">
            Complete history of interest payouts and principal transactions
          </p>
        </div>
        <button
          className="btn btn-primary fw-bold px-4 shadow-sm"
          onClick={downloadTransactionHistoryPDF}
          disabled={!selectedInvestor}
        >
          <i className="bi bi-file-earmark-pdf-fill me-2"></i>
          Export Full Statement
        </button>
      </div>

      <div className="row">
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="fw-bold mb-0">Select Investor</h6>
            </div>
            <div className="card-body p-0">
              <div
                className="list-group list-group-flush"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                {processedInvestors.map((inv) => (
                  <button
                    key={inv.id}
                    className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex flex-column ${selectedInvestorId === inv.id ? "bg-primary bg-opacity-10 border-start border-primary border-4 text-primary" : ""}`}
                    onClick={() => {
                      setSelectedInvestorId(inv.id);
                      setInterestPage(1);
                      setPayoutPage(1);
                    }}
                  >
                    <span className="fw-bold">{inv.name}</span>
                    <small
                      className={
                        selectedInvestorId === inv.id
                          ? "text-primary"
                          : "text-muted"
                      }
                    >
                      {inv.phone}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {selectedInvestor ? (
            <>
              {/* Summary Section */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100">
                    <div className="card-body p-3">
                      <p className="small text-muted mb-1">
                        Total Interest Paid
                      </p>
                      <h4 className="fw-bold text-success mb-0">
                        ₹{selectedInvestor.totalInterestPaid.toLocaleString()}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100">
                    <div className="card-body p-3">
                      <p className="small text-muted mb-1">Unpaid Interest</p>
                      <h4 className="fw-bold text-warning mb-0">
                        ₹{selectedInvestor.unpaidInterest?.toFixed(2) || "0.00"}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100">
                    <div className="card-body p-3">
                      <p className="small text-muted mb-1">Current Principal</p>
                      <h4 className="fw-bold text-primary mb-0">
                        ₹{selectedInvestor.currentPrincipal.toLocaleString()}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interest Payments */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-cash-coin me-2 text-primary"></i>
                    Interest Payment History
                  </h6>
                  <span className="badge bg-primary rounded-pill">
                    {interestHistory.length} Payments
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="px-4">Month</th>
                          <th>Amount</th>
                          <th>Paid Date</th>
                          <th>Mode</th>
                          <th>Reference</th>
                          <th className="px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedInterest.length > 0 ? (
                          paginatedInterest.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-4 fw-bold">{payment.month}</td>
                              <td className="text-success fw-bold">
                                ₹{payment.amount.toLocaleString()}
                              </td>
                              <td>
                                {new Date(
                                  payment.paidDate,
                                ).toLocaleDateString()}
                              </td>
                              <td className="text-capitalize">
                                {payment.mode}
                              </td>
                              <td className="small text-muted">
                                {payment.products ||
                                  payment.saleId?.billNumber ||
                                  payment.billNumber ||
                                  payment.reference ||
                                  payment.notes ||
                                  "-"}
                              </td>
                              <td className="px-4">
                                <span className="badge bg-success bg-opacity-10 text-success">
                                  Paid
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center py-5 text-muted"
                            >
                              No interest payments recorded
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer bg-white border-0 pb-3">
                  {renderPagination(
                    interestPage,
                    totalInterestPages,
                    setInterestPage,
                  )}
                </div>
              </div>

              {/* Principal Transactions */}
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-arrow-left-right me-2 text-danger"></i>
                    Principal Transaction History
                  </h6>
                  <span className="badge bg-danger rounded-pill">
                    {payoutHistory.length} Transactions
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="px-4">Date</th>
                          <th>Amount</th>
                          <th>Type</th>
                          <th>Mode</th>
                          <th>Reference</th>
                          <th className="px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPayout.length > 0 ? (
                          paginatedPayout.map((payout) => (
                            <tr key={payout.id}>
                              <td className="px-4">
                                {new Date(payout.date).toLocaleDateString()}
                              </td>
                              <td
                                className={`fw-bold ${payout.type === "payin" ? "text-success" : "text-danger"}`}
                              >
                                {payout.type === "payin" ? "+" : "-"}₹
                                {payout.amount.toLocaleString()}
                              </td>
                              <td className="text-capitalize">{payout.type}</td>
                              <td className="text-capitalize">{payout.mode}</td>
                              <td className="small text-muted font-monospace">
                                {payout.reference || "-"}
                              </td>
                              <td className="px-4">
                                <span className="badge bg-success bg-opacity-10 text-success">
                                  Completed
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center py-5 text-muted"
                            >
                              No principal transactions recorded
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer bg-white border-0 pb-3">
                  {renderPagination(
                    payoutPage,
                    totalPayoutPages,
                    setPayoutPage,
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card border-0 shadow-sm rounded-4 h-100 d-flex justify-content-center align-items-center py-5">
              <div className="text-center">
                <i className="bi bi-person-badge fs-1 text-muted opacity-25 mb-3"></i>
                <h5 className="text-muted">
                  Select an investor to view transaction history
                </h5>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorHistory;
