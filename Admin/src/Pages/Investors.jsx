import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config/api";
import "../Styles/dashboard.css";
import InvestorsList from "../Components/Investors/InvestorsList";
import InvestorModal from "../Components/Investors/InvestorModal";
import InterestPaymentModal from "../Components/Investors/InterestPaymentModal";
import InvestorDetailsModal from "../Components/Investors/InvestorDetailsModal";
import ProductPurchaseModal from "../Components/Investors/ProductPurchaseModal";
import PrincipalPayoutModal from "../Components/Investors/PrincipalPayoutModal";
import InvestorHistoryModal from "../Components/Investors/InvestorHistoryModal";
import ConfirmationModal from "../Components/Modals/ConfirmationModal";
import { exportInvestorPDF } from "../utils/investorUtils";

import { useCustomer } from "../Context/CustomerContext";

const Investors = () => {
  const {
    investors,
    loading,
    error,
    fetchInvestors,
    upsertCustomer,
    checkMaturity,
    closeInvestment,
    deleteInvestment,
    processPrincipalTransaction,
  } = useCustomer();
  const navigate = useNavigate();
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "danger",
  });

  useEffect(() => {
    checkMaturity();
    fetchInvestors();
  }, [checkMaturity]);

  // Map backend structure to frontend expectations
  // Handle new array-based structure: One row per investment
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
        totalInterestPaid: details.totalInterestPaid || 0, // Prevent undefined error
      };
    });
  });

  const handleCloseInvestment = (investor) => {
    setConfirmModal({
      isOpen: true,
      title: "Close Investment",
      message:
        "Are you sure you want to close this investment? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        try {
          const customerId = investor.customerId || investor._id;
          const investmentId = investor.investmentId || investor._id;

          if (!customerId || !investmentId) {
            toast.error("Error: Missing ID information.");
            return;
          }

          const result = await closeInvestment(customerId, investmentId);
          if (result && result.success) {
            toast.success("Investment closed successfully");
          } else {
            toast.error(result?.message || "Failed to close investment");
          }
        } catch (err) {
          console.error(err);
          toast.error("An error occurred while closing investment.");
        }
      },
    });
  };

  // Calculate pending interest for current month
  const calculatePendingInterest = (investor) => {
    const principal = investor.principalAmount;
    const rate = investor.interestRate / 100; // Monthly rate (paise per ₹1)

    if (investor.interestType === "simple") {
      return principal * rate;
    } else {
      // Compound interest
      const currentAmount = principal + (investor.totalInterestPaid || 0);
      return currentAmount * rate;
    }
  };

  // Calculate accumulated interest from start date to now
  const calculateAccumulatedInterest = (investor) => {
    const startDate = new Date(investor.startDate);
    const currentDate = new Date();
    const monthsElapsed = Math.floor(
      (currentDate - startDate) / (1000 * 60 * 60 * 24 * 30.44),
    );

    const principal = investor.principalAmount;
    const monthlyRate = investor.interestRate / 100; // Treated as monthly rate now

    let totalAccumulated = 0;

    if (investor.interestType === "simple") {
      // Simple interest: P × R × T
      totalAccumulated = principal * monthlyRate * monthsElapsed;
    } else {
      // Compound interest: P × (1 + R)^T - P
      totalAccumulated =
        principal * Math.pow(1 + monthlyRate, monthsElapsed) - principal;
    }

    return totalAccumulated;
  };

  // Calculate unpaid interest (accumulated - already paid)
  // NOW: Use 'unpaidInterest' from DB (which stores fully matured months)
  // + partial interest for current month (if desired, or just show DB value)
  const calculateUnpaidInterest = (investor) => {
    // If we have DB field, use it.
    // If strictly DB driven: return investor.unpaidInterest || 0;

    // If user wants to see real-time accrual including current partial month:
    /*
      const lastAccrual = investor.lastAccrualDate ? new Date(investor.lastAccrualDate) : new Date(investor.startDate);
      const now = new Date();
      // Calculate days elapsed since lastAccrual for partial... 
      // For now, let's respect the "Maturity" model requested. 
      // Typically "Unpaid" implies "Due". Unmatured interest is not yet due.
    */

    // RETURNING PERSISTED UNPAID INTEREST
    // But fall back to old calc if new system hasn't run yet?
    if (investor.unpaidInterest !== undefined) {
      return investor.unpaidInterest;
    }

    // Fallback for legacy/unmigrated data
    const accumulated = calculateAccumulatedInterest(investor);
    const unpaid = accumulated - investor.totalInterestPaid;
    return Math.max(0, unpaid);
  };

  const handleAddInvestor = () => {
    navigate("/investor/add");
  };

  const handleEditInvestor = (investor) => {
    navigate("/investor/add", { state: { investor } });
  };

  const handleDeleteInvestor = (id) => {
    // Find the investor record to get customerId and investmentId
    const target = processedInvestors.find((inv) => inv.id === id);
    if (!target) {
      toast.error("Investor record not found.");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Investment",
      message: "Are you sure you want to delete this investment record?",
      type: "danger",
      onConfirm: async () => {
        try {
          const result = await deleteInvestment(
            target.customerId,
            target.investmentId,
          );
          if (result && result.success) {
            toast.success("Investment record deleted successfully");
          } else {
            toast.error(result?.message || "Failed to delete investment");
          }
        } catch (err) {
          console.error("Delete Error:", err);
          toast.error("An error occurred while deleting.");
        }
      },
    });
  };

  const handlePayInterest = (investor) => {
    setSelectedInvestor(investor);
    setShowInterestModal(true);
  };

  const handleViewDetails = (investor) => {
    setSelectedInvestor(investor);
    setShowDetailsModal(true);
  };

  const handleSaveInvestor = async (investorData) => {
    try {
      // Prepare data for backend
      const payload = {
        name: investorData.name,
        phone: investorData.phone,
        email: investorData.email || "",
        city: investorData.city || "",
        role: "Investor", // Default to investor role when adding from here
        initialPaymentAccountId: investorData.paymentAccountId, // Pass explicit account for initial Funds
        investorDetails: {
          ...investorData,
          // Include investment ID when editing to ensure backend updates the correct record
          _id:
            editMode && selectedInvestor?.investmentId
              ? selectedInvestor.investmentId
              : undefined,
          id:
            editMode && selectedInvestor?.investmentId
              ? selectedInvestor.investmentId
              : undefined,
          currentPrincipal:
            editMode && selectedInvestor?.currentPrincipal !== undefined
              ? selectedInvestor.currentPrincipal
              : investorData.principalAmount,
          // Preserve existing transaction histories when editing
          interestHistory:
            editMode && selectedInvestor?.interestHistory
              ? selectedInvestor.interestHistory
              : [],
          payoutHistory:
            editMode && selectedInvestor?.payoutHistory
              ? selectedInvestor.payoutHistory
              : [],
          investments:
            editMode && selectedInvestor?.investments
              ? selectedInvestor.investments
              : [
                  {
                    date: investorData.startDate,
                    amount: investorData.principalAmount,
                    type: "initial",
                  },
                ],
          // Preserve maturity tracking fields
          unpaidInterest:
            editMode && selectedInvestor?.unpaidInterest !== undefined
              ? selectedInvestor.unpaidInterest
              : 0,
          lastAccrualDate:
            editMode && selectedInvestor?.lastAccrualDate
              ? selectedInvestor.lastAccrualDate
              : undefined,
          totalInterestPaid:
            editMode && selectedInvestor?.totalInterestPaid !== undefined
              ? selectedInvestor.totalInterestPaid
              : 0,
        },
      };

      const result = await upsertCustomer(payload);
      if (result) {
        setShowInvestorModal(false);
        setEditMode(false);
        setSelectedInvestor(null);
        // Generate Certificate for new investor
        if (!editMode) {
          exportInvestorPDF(investorData);
        }
      }
    } catch (err) {
      console.error("Failed to save investor:", err);
      toast.error("Failed to save investor details");
    }
  };

  const handleInterestPayment = async (paymentData) => {
    if (!selectedInvestor) return;

    try {
      const payload = {
        customerId:
          selectedInvestor.customerId ||
          selectedInvestor._id ||
          selectedInvestor.id,
        investmentId:
          selectedInvestor.investmentId ||
          selectedInvestor._id ||
          selectedInvestor.investorDetails?._id,
        type: "interest_payout",
        amount: parseFloat(paymentData.amount),
        paymentAccountId: paymentData.paymentAccountId,
        date: paymentData.paidDate,
        mode: paymentData.mode,
        reference: paymentData.reference,
        notes: paymentData.notes,
        month: paymentData.month,
      };

      const result = await processPrincipalTransaction(payload);
      if (result && result.success) {
        toast.success(result.message || "Interest payment recorded!");
        setShowInterestModal(false);
      } else {
        toast.error(result?.message || "Transaction failed");
      }
    } catch (err) {
      console.error("Interest Payment Error:", err);
      toast.error("Failed to pay interest");
    }
  };

  const handleBuyProducts = (investor) => {
    setSelectedInvestor(investor);
    setShowProductModal(true);
  };

  const handleProductPurchase = async (purchaseData) => {
    if (!selectedInvestor) return;

    try {
      const token = localStorage.getItem("accessToken");

      // Validate Payment Method (Passed from Modal)
      if (!purchaseData.paymentMethod) {
        toast.warning("Please select a payment account to generate the bill.");
        return;
      }

      const salePayload = {
        items: purchaseData.products.map((p) => ({
          product: p._id,
          qty: p.qty,
          price: p.price,
          lineTotal: p.price * p.qty,
          taxAmount: 0,
          taxableValue: p.price * p.qty,
        })),
        subtotal: purchaseData.totalAmount,
        totalTax: 0,
        grandTotal: purchaseData.totalAmount,
        paymentMethod: purchaseData.paymentMethod, // From Modal Selection
        customer: selectedInvestor.customerId || selectedInvestor._id,
      };

      const saleRes = await axios.post(API_ENDPOINTS.SALES.BASE, salePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!saleRes.data || !saleRes.data.success) {
        toast.error("Failed to create sale bill.");
        throw new Error("Failed to create sale bill.");
      }

      const saleInfo = saleRes.data.sale;

      const investor = selectedInvestor;
      const currentUnpaid =
        investor.unpaidInterest !== undefined
          ? investor.unpaidInterest
          : calculateUnpaidInterest(investor);

      const amount = purchaseData.totalAmount;
      const newUnpaid = Math.max(0, currentUnpaid - amount);

      const newHistoryItem = {
        id: (investor.interestHistory?.length || 0) + 1,
        month: new Date().toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: amount,
        paidDate: new Date().toISOString().split("T")[0],
        mode: "products",
        status: "paid",
        products: `Bill: ${saleInfo.billNumber}`,
        saleId: saleInfo._id,
        reference: saleInfo.billNumber,
      };

      const updatedHistory = [
        ...(investor.interestHistory || []),
        newHistoryItem,
      ];

      const cleanPayload = {
        id: investor.customerId || investor._id || investor.id,
        name: investor.name,
        phone: investor.phone,
        email: investor.email,
        city: investor.city,
        investorDetails: {
          ...investor,
          _id: investor.investmentId || investor._id,
          interestHistory: updatedHistory,
          totalInterestPaid: (investor.totalInterestPaid || 0) + amount,
          lastInterestPaid: new Date().toISOString().split("T")[0],
          unpaidInterest: newUnpaid,
        },
      };

      const result = await upsertCustomer(cleanPayload);
      if (result) {
        setShowProductModal(false);
        toast.success(
          `Product purchase successful! Bill: ${saleInfo.billNumber}`,
        );
      }
    } catch (err) {
      console.error("Product Purchase Error:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to process product purchase. Check stock or try again.",
      );
    }
  };

  const handlePayoutPrincipal = (investor) => {
    setSelectedInvestor(investor);
    setShowPayoutModal(true);
  };

  const handlePrincipalPayout = async (payoutData) => {
    if (!selectedInvestor) return;

    try {
      const payload = {
        customerId:
          selectedInvestor.customerId ||
          selectedInvestor._id ||
          selectedInvestor.id,
        investmentId:
          selectedInvestor.investmentId ||
          selectedInvestor._id ||
          selectedInvestor.investorDetails._id,
        type: payoutData.type,
        amount: payoutData.amount,
        paymentAccountId: payoutData.paymentAccountId,
        date: payoutData.payoutDate,
        mode: payoutData.mode,
        reference: payoutData.reference,
        notes: payoutData.notes,
      };

      const result = await processPrincipalTransaction(payload);
      if (result && result.success) {
        toast.success(result.message || "Transaction successful!");
        setShowPayoutModal(false);
      } else {
        toast.error(result?.message || "Transaction failed");
      }
    } catch (err) {
      console.error("Failed to process transaction:", err);
      toast.error("Failed to save transaction. Please try again.");
    }
  };

  const handleViewHistoryList = () => {
    navigate("/investor/history");
  };

  if (loading && investors.length === 0) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "calc(100vh - 100px)" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-4">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Investors Management
          </h2>
          <p className="text-muted mb-0">
            Manage investors, track investments, and process interest payments
          </p>
        </div>
        <button
          className="btn btn-primary px-4 fw-bold d-flex align-items-center gap-2"
          onClick={handleAddInvestor}
        >
          <i className="bi bi-plus-circle"></i>
          Add New Investor
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Investors</p>
                  <h3 className="fw-bold text-primary mb-0">
                    {processedInvestors.length}
                  </h3>
                </div>
                <i className="bi bi-people fs-1 text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Investment</p>
                  <h3 className="fw-bold text-success mb-0">
                    ₹
                    {processedInvestors
                      .reduce(
                        (sum, inv) => sum + (inv.currentPrincipal || 0),
                        0,
                      )
                      .toLocaleString()}
                  </h3>
                </div>
                <i className="bi bi-cash-stack fs-1 text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Interest Paid</p>
                  <h3 className="fw-bold text-warning mb-0">
                    ₹
                    {processedInvestors
                      .reduce(
                        (sum, inv) => sum + (inv.totalInterestPaid || 0),
                        0,
                      )
                      .toLocaleString()}
                  </h3>
                </div>
                <i className="bi bi-graph-up fs-1 text-warning opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info bg-opacity-10">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted small mb-1">Total Pending</p>
                  <h3 className="fw-bold text-info mb-0">
                    ₹
                    {processedInvestors
                      .reduce(
                        (sum, inv) => sum + calculateUnpaidInterest(inv),
                        0,
                      )
                      .toFixed(2)}
                  </h3>
                </div>
                <i className="bi bi-clock-history fs-1 text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investors List */}
      <InvestorsList
        investors={processedInvestors}
        onEdit={handleEditInvestor}
        onDelete={handleDeleteInvestor}
        onPayInterest={handlePayInterest}
        onViewDetails={handleViewDetails}
        onBuyProducts={handleBuyProducts}
        onPayoutPrincipal={handlePayoutPrincipal}
        onViewHistory={handleViewHistoryList}
        onDownloadCertificate={exportInvestorPDF}
        onCloseInvestment={handleCloseInvestment}
        calculatePendingInterest={calculatePendingInterest}
        calculateAccumulatedInterest={calculateAccumulatedInterest}
        calculateUnpaidInterest={calculateUnpaidInterest}
      />

      {/* Modals */}
      {/* InvestorModal removed as it is now a separate page */}

      <InterestPaymentModal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        onSave={handleInterestPayment}
        investor={selectedInvestor}
        pendingInterest={
          selectedInvestor ? calculatePendingInterest(selectedInvestor) : 0
        }
        accumulatedInterest={
          selectedInvestor ? calculateAccumulatedInterest(selectedInvestor) : 0
        }
        unpaidInterest={
          selectedInvestor ? calculateUnpaidInterest(selectedInvestor) : 0
        }
      />

      <InvestorDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        investor={selectedInvestor}
        onEdit={handleEditInvestor}
        onDelete={handleDeleteInvestor}
        onCloseInvestment={handleCloseInvestment}
        onDownloadCertificate={exportInvestorPDF}
      />

      <ProductPurchaseModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        investor={selectedInvestor}
        unpaidInterest={
          selectedInvestor ? calculateUnpaidInterest(selectedInvestor) : 0
        }
        onSave={handleProductPurchase}
      />

      <PrincipalPayoutModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        investor={selectedInvestor}
        onSave={handlePrincipalPayout}
      />

      {/* InvestorHistoryModal removed as it is now a separate page */}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Investors;
