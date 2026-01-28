import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCustomer } from "../Context/CustomerContext";
import { toast } from "react-toastify";
import ConfirmationModal from "../Components/Modals/ConfirmationModal";
import { exportInvestorPDF } from "../utils/investorUtils";

const InvestorDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    investors,
    loading,
    deleteInvestment,
    closeInvestment,
    upsertCustomer,
  } = useCustomer();

  const [investor, setInvestor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "danger",
  });

  // Replicate the flattening/finding logic from Investors.jsx to ensure consistent ID matching
  useEffect(() => {
    if (investors.length > 0) {
      const processedInvestors = investors.flatMap((inv) => {
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
            id: details._id || inv._id, // Use Investment ID if available
            customerId: inv._id,
            investmentId: details.id || details._id,
            ...details, // Flatten investment details
            currentPrincipal,
            totalInterestPaid: details.totalInterestPaid || 0,
          };
        });
      });

      const foundInvestor = processedInvestors.find((inv) => inv.id === id);
      if (foundInvestor) {
        setInvestor(foundInvestor);
      } else {
        // Only redirect if we're sure we have data and still can't find it
        if (!loading) {
          toast.error("Investor not found");
          navigate("/investors");
        }
      }
    }
  }, [investors, id, navigate, loading]);

  const handleEdit = () => {
    navigate("/investor/add", { state: { investor } });
  };

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Investment",
      message: "Are you sure you want to delete this investment record?",
      type: "danger",
      onConfirm: async () => {
        const result = await deleteInvestment(
          investor.customerId,
          investor.investmentId,
        );
        if (result && result.success) {
          toast.success("Investment deleted");
          navigate("/investors");
        } else {
          toast.error("Failed to delete");
        }
      },
    });
  };

  const handleCloseInvestment = () => {
    setConfirmModal({
      isOpen: true,
      title: "Close Investment",
      message:
        "Are you sure you want to close this investment? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        const result = await closeInvestment(
          investor.customerId,
          investor.investmentId,
        );
        if (result && result.success) {
          toast.success("Investment closed");
        } else {
          toast.error("Failed to close");
        }
      },
    });
  };

  if (!investor) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Reuse the "clean" styling from the modal
  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            className="btn btn-link text-decoration-none p-0 mb-1 fw-bold text-secondary"
            onClick={() => navigate("/investors")}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Investors
          </button>
          <h2 className="fw-bold text-dark mb-0">
            Investor Details: {investor.name}
          </h2>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-danger fw-bold"
            onClick={handleDelete}
          >
            <i className="bi bi-trash me-2"></i>Delete
          </button>
          <button
            className="btn btn-info fw-bold text-white"
            onClick={() => exportInvestorPDF(investor)}
          >
            <i className="bi bi-file-earmark-pdf-fill me-2"></i>Certificate
          </button>
          {investor.status !== "closed" && (
            <button
              className="btn btn-outline-danger fw-bold"
              onClick={handleCloseInvestment}
            >
              <i className="bi bi-x-circle me-2"></i>Close Investment
            </button>
          )}
          <button
            className="btn btn-warning fw-bold text-dark"
            onClick={handleEdit}
          >
            <i className="bi bi-pencil me-2"></i>Edit
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {/* 1. Personal Info */}
          <div className="border-bottom">
            <div className="bg-white py-2 px-4 border-bottom-0">
              <h6 className="mb-0 fw-bold text-dark small">
                <i className="bi bi-info-circle me-2"></i>Personal Information
              </h6>
            </div>
            <div className="py-2 px-4 pb-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <small className="text-muted">Name:</small>
                  <div className="fw-bold fs-5">{investor.name}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Phone:</small>
                  <div className="fw-bold fs-5">{investor.phone}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Email:</small>
                  <div className="fw-bold fs-5">{investor.email || "N/A"}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Status:</small>
                  <div className="d-flex gap-2 align-items-center">
                    <span
                      className={`badge ${
                        investor.status === "active"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {investor.status}
                    </span>
                    {investor.isMatured && (
                      <span className="badge bg-info text-white">Matured</span>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Start Date:</small>
                  <div className="fw-bold">
                    {new Date(investor.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Last Interest Paid:</small>
                  <div className="fw-bold">
                    {investor.lastInterestPaid
                      ? new Date(investor.lastInterestPaid).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. KYC & Banking */}
          <div className="border-bottom">
            <div className="bg-white py-2 px-4 border-bottom-0">
              <h6 className="mb-0 fw-bold text-dark small">
                <i className="bi bi-bank me-2"></i>KYC & Banking Details
              </h6>
            </div>
            <div className="py-2 px-4 pb-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <small className="text-muted">Investor Type:</small>
                  <div className="fw-bold text-capitalize">
                    {investor.investorType || "Individual"}
                  </div>
                </div>
                {/* ... other fields similarly adapted ... */}
                <div className="col-md-4">
                  <small className="text-muted">PAN Number:</small>
                  <div className="fw-bold font-monospace">
                    {investor.panNumber || "N/A"}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Aadhar Number:</small>
                  <div className="fw-bold font-monospace">
                    {investor.aadharNumber || "N/A"}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">KYC Status:</small>
                  <div>
                    <span
                      className={`badge ${
                        investor.kycStatus === "verified"
                          ? "bg-success"
                          : investor.kycStatus === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {(investor.kycStatus || "pending").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Preferred Payout Mode:</small>
                  <div className="fw-bold text-capitalize">
                    {investor.preferredPayoutMode || "Cash"}
                  </div>
                </div>
              </div>
              {/* Bank Accounts List - keeping it simple for now, can copy full logic if needed */}
              {investor.bankAccounts?.length > 0 && (
                <div className="mt-3">
                  <small className="text-muted fw-bold">Bank Accounts</small>
                  {investor.bankAccounts.map((bank, i) => (
                    <div key={i} className="row g-2 mt-1 border-top pt-2">
                      <div className="col-md-3">
                        <small className="text-muted">Bank:</small>{" "}
                        <b>{bank.bankName}</b>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted">Acc:</small>{" "}
                        <b className="font-monospace">{bank.accountNumber}</b>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted">IFSC:</small>{" "}
                        <b className="font-monospace">{bank.ifsc}</b>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Investment Details */}
          <div className="border-bottom">
            <div className="bg-white py-2 px-4 border-bottom-0">
              <h6 className="mb-0 fw-bold text-dark small">
                <i className="bi bi-cash-stack me-2"></i>Investment Details
              </h6>
            </div>
            <div className="py-2 px-4 pb-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <small className="text-muted">Principal Amount:</small>
                  <div className="fw-bold text-success fs-4">
                    ₹{investor.principalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Interest Rate:</small>
                  <div className="fw-bold text-primary fs-4">
                    {investor.interestRate} paise/₹1/m
                  </div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Interest Type:</small>
                  <div className="fw-bold text-info fs-4">
                    {investor.interestType === "simple" ? "Simple" : "Compound"}
                  </div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Total Interest Paid:</small>
                  <div className="fw-bold text-danger fs-4">
                    ₹{investor.totalInterestPaid.toLocaleString()}
                  </div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Current Value:</small>
                  <div className="fw-bold text-success fs-4">
                    ₹
                    {(
                      investor.principalAmount + investor.totalInterestPaid
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. History */}
          <div className="">
            <div className="bg-white py-2 px-4 border-bottom-0">
              <h6 className="mb-0 fw-bold text-dark small">
                <i className="bi bi-journal-plus me-2"></i>Principal History
                (Deposits)
              </h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light small">
                  <tr>
                    <th className="px-4">Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Prev Maturity</th>
                    <th>Next Maturity</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {investor.investments?.map((inv, idx) => {
                    const depositDate = new Date(inv.date);
                    const lastAccrual = inv.lastAccrualDate
                      ? new Date(inv.lastAccrualDate)
                      : null;
                    const nextMaturity = lastAccrual
                      ? new Date(
                          new Date(lastAccrual).setMonth(
                            lastAccrual.getMonth() + 1,
                          ),
                        )
                      : new Date(
                          new Date(depositDate).setMonth(
                            depositDate.getMonth() + 1,
                          ),
                        );

                    return (
                      <tr key={idx}>
                        <td className="px-4">
                          {depositDate.toLocaleDateString()}
                        </td>
                        <td className="fw-bold">
                          ₹{inv.amount.toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${inv.isMatured ? "bg-success" : "bg-warning text-dark"}`}
                          >
                            {inv.isMatured ? "Matured" : "Pending"}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {lastAccrual
                            ? lastAccrual.toLocaleDateString()
                            : "Initial"}
                        </td>
                        <td className="fw-bold small text-primary">
                          {nextMaturity.toLocaleDateString()}
                        </td>
                        <td className="text-capitalize">
                          {inv.type || "deposit"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        type={confirmModal.type}
      />
    </div>
  );
};

export default InvestorDetailsPage;
