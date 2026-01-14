import React, { useState } from "react";
import "../../Styles/dashboard.css";
import InvestorsList from "../../Components/Investors/InvestorsList";
import InvestorModal from "../../Components/Investors/InvestorModal";
import InterestPaymentModal from "../../Components/Investors/InterestPaymentModal";
import InvestorDetailsModal from "../../Components/Investors/InvestorDetailsModal";
import ProductPurchaseModal from "../../Components/Investors/ProductPurchaseModal";
import PrincipalPayoutModal from "../../Components/Investors/PrincipalPayoutModal";
import InvestorHistoryModal from "../../Components/Investors/InvestorHistoryModal";

// Hardcoded data for demonstration
const MOCK_INVESTORS = [
  {
    id: 1,
    name: "Rajesh Kumar",
    phone: "9876543210",
    email: "rajesh@example.com",
    investorType: "individual",
    panNumber: "ABCDE1234F",
    kycStatus: "verified",
    preferredPayoutMode: "bank",
    bankAccounts: [
      {
        id: 1,
        accountHolderName: "Rajesh Kumar",
        bankName: "HDFC Bank",
        accountNumber: "1234567890",
        ifsc: "HDFC0001234",
        isDefault: true,
      },
      {
        id: 2,
        accountHolderName: "Rajesh K",
        bankName: "SBI",
        accountNumber: "9876543210",
        ifsc: "SBIN0001234",
        isDefault: false,
      },
    ],
    upiAccounts: [
      {
        id: 1,
        upiId: "rajesh@hdfc",
        upiPhone: "9876543210",
        isDefault: true,
      },
    ],
    principalAmount: 100000,
    currentPrincipal: 100000,
    interestRate: 12,
    interestType: "simple",
    startDate: "2024-01-15",
    lastInterestPaid: "2025-12-15",
    totalInterestPaid: 12000,
    status: "active",
    paymentMode: "cash",
    investments: [
      {
        id: 1,
        date: "2024-01-15",
        amount: 100000,
        type: "initial",
      },
    ],
    payoutHistory: [
      {
        id: 1,
        date: "2024-07-10",
        amount: 625,
        type: "interest",
        mode: "bank",
        reference: "NEFT-98765",
        status: "paid",
      },
    ],
    interestHistory: [
      {
        id: 1,
        month: "Feb 2024",
        amount: 1000,
        paidDate: "2024-02-15",
        mode: "cash",
        status: "paid",
        products: "",
      },
      {
        id: 2,
        month: "Mar 2024",
        amount: 1000,
        paidDate: "2024-03-15",
        mode: "products",
        status: "paid",
        products: "Groceries worth ₹1000",
      },
    ],
  },
  {
    id: 2,
    name: "Priya Sharma",
    phone: "9123456789",
    email: "priya@example.com",
    investorType: "individual",
    panNumber: "FGHIJ5678K",
    kycStatus: "verified",
    preferredPayoutMode: "cash",
    bankDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
    },
    principalAmount: 250000,
    currentPrincipal: 250000,
    interestRate: 10,
    interestType: "compound",
    startDate: "2024-03-01",
    lastInterestPaid: "2025-12-01",
    totalInterestPaid: 22500,
    status: "active",
    paymentMode: "reinvest",
    investments: [
      {
        id: 1,
        date: "2024-03-01",
        amount: 250000,
        type: "initial",
      },
    ],
    payoutHistory: [],
    interestHistory: [
      {
        id: 1,
        month: "Apr 2024",
        amount: 2083.33,
        paidDate: "2024-04-01",
        mode: "reinvest",
        status: "paid",
      },
    ],
  },
  {
    id: 3,
    name: "Arun Patel",
    phone: "9988776655",
    email: "arun@example.com",
    investorType: "individual",
    panNumber: "KLMNO9012P",
    kycStatus: "pending",
    preferredPayoutMode: "upi",
    bankDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
    },
    upiAccounts: [
      {
        id: 1,
        upiId: "arun@upi",
        upiPhone: "9988776655",
        isDefault: true,
      },
      {
        id: 2,
        upiId: "arun.secondary@upi",
        upiPhone: "9988000000",
        isDefault: false,
      },
    ],
    principalAmount: 50000,
    currentPrincipal: 50000,
    interestRate: 15,
    interestType: "simple",
    startDate: "2024-06-10",
    lastInterestPaid: "2025-11-10",
    totalInterestPaid: 3750,
    status: "active",
    paymentMode: "cash",
    investments: [
      {
        id: 1,
        date: "2024-06-10",
        amount: 50000,
        type: "initial",
      },
    ],
    payoutHistory: [],
    interestHistory: [],
  },
];

import { useCustomer } from "../../Context/CustomerContext";

const Investors = () => {
  const { investors, loading, error, fetchInvestors, upsertCustomer } =
    useCustomer();
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Map backend structure to frontend expectations if necessary
  const processedInvestors = investors.map((inv) => {
    const details = inv.investorDetails || {};
    // If currentPrincipal is 0 and there's no payout history, it's likely uninitialized
    const currentPrincipal =
      details.currentPrincipal === 0 &&
      (!details.payoutHistory || details.payoutHistory.length === 0)
        ? details.principalAmount
        : details.currentPrincipal ?? details.principalAmount;

    return {
      ...inv,
      id: inv._id, // Use MongoDB ID as id
      ...details, // Flatten investorDetails for the list/props
      currentPrincipal,
    };
  });

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
      (currentDate - startDate) / (1000 * 60 * 60 * 24 * 30.44)
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
  const calculateUnpaidInterest = (investor) => {
    const accumulated = calculateAccumulatedInterest(investor);
    const unpaid = accumulated - investor.totalInterestPaid;
    return Math.max(0, unpaid); // Never negative
  };

  const handleAddInvestor = () => {
    setSelectedInvestor(null);
    setEditMode(false);
    setShowInvestorModal(true);
  };

  const handleEditInvestor = (investor) => {
    setSelectedInvestor(investor);
    setEditMode(true);
    setShowInvestorModal(true);
  };

  const handleDeleteInvestor = (id) => {
    if (window.confirm("Are you sure you want to delete this investor?")) {
      setInvestors(investors.filter((inv) => inv.id !== id));
    }
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
        investorDetails: {
          ...investorData,
          currentPrincipal:
            editMode && selectedInvestor?.currentPrincipal !== undefined
              ? selectedInvestor.currentPrincipal
              : investorData.principalAmount,
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
        },
      };

      const result = await upsertCustomer(payload);
      if (result) {
        setShowInvestorModal(false);
      }
    } catch (err) {
      console.error("Failed to save investor:", err);
    }
  };

  const handleInterestPayment = (paymentData) => {
    const updatedInvestors = investors.map((inv) => {
      if (inv.id === selectedInvestor.id) {
        const newHistory = [
          ...inv.interestHistory,
          {
            id: inv.interestHistory.length + 1,
            ...paymentData,
            status: "paid",
          },
        ];

        let updatedPrincipal = inv.principalAmount;
        let updatedTotalPaid = inv.totalInterestPaid + paymentData.amount;

        if (paymentData.mode === "reinvest") {
          updatedPrincipal += paymentData.amount;
        }

        return {
          ...inv,
          interestHistory: newHistory,
          totalInterestPaid: updatedTotalPaid,
          principalAmount: updatedPrincipal,
          lastInterestPaid: paymentData.paidDate,
          paymentMode: paymentData.mode,
        };
      }
      return inv;
    });

    setInvestors(updatedInvestors);
    setShowInterestModal(false);
  };

  const handleBuyProducts = (investor) => {
    setSelectedInvestor(investor);
    setShowProductModal(true);
  };

  const handleProductPurchase = (purchaseData) => {
    const updatedInvestors = investors.map((inv) => {
      if (inv.id === selectedInvestor.id) {
        const newHistory = [
          ...inv.interestHistory,
          {
            id: inv.interestHistory.length + 1,
            month: new Date().toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            amount: purchaseData.totalAmount,
            paidDate: new Date().toISOString().split("T")[0],
            mode: "products",
            status: "paid",
            products: purchaseData.products
              .map((p) => `${p.name} (${p.qty}x)`)
              .join(", "),
          },
        ];

        return {
          ...inv,
          interestHistory: newHistory,
          totalInterestPaid: inv.totalInterestPaid + purchaseData.totalAmount,
          lastInterestPaid: new Date().toISOString().split("T")[0],
        };
      }
      return inv;
    });

    setInvestors(updatedInvestors);
    setShowProductModal(false);
  };

  const handlePayoutPrincipal = (investor) => {
    setSelectedInvestor(investor);
    setShowPayoutModal(true);
  };

  const handlePrincipalPayout = (payoutData) => {
    const updatedInvestors = investors.map((inv) => {
      if (inv.id === selectedInvestor.id) {
        const newCurrentPrincipal = inv.currentPrincipal - payoutData.amount;

        return {
          ...inv,
          currentPrincipal: newCurrentPrincipal,
          payoutHistory: [
            ...(inv.payoutHistory || []),
            {
              id: (inv.payoutHistory?.length || 0) + 1,
              amount: payoutData.amount,
              date: payoutData.payoutDate,
              reason: payoutData.reason,
              mode: payoutData.mode,
              reference: payoutData.reference,
              notes: payoutData.notes,
              remainingPrincipal: newCurrentPrincipal, // changed from newPrincipal for clarity if preferred, but existing code used newPrincipal. Let's stick to newPrincipal if that was the convention, or add standard fields. The screenshot showed Status, let's add Status.
              status: "paid",
              previousPrincipal: inv.currentPrincipal,
              newPrincipal: newCurrentPrincipal,
            },
          ],
        };
      }
      return inv;
    });

    setInvestors(updatedInvestors);
    setShowPayoutModal(false);
  };

  const handleViewHistoryList = () => {
    setShowHistoryModal(true);
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
                        0
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
                        0
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
                  <p className="text-muted small mb-1">Pending This Month</p>
                  <h3 className="fw-bold text-info mb-0">
                    ₹
                    {processedInvestors
                      .reduce(
                        (sum, inv) => sum + calculatePendingInterest(inv),
                        0
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
        calculatePendingInterest={calculatePendingInterest}
        calculateAccumulatedInterest={calculateAccumulatedInterest}
        calculateUnpaidInterest={calculateUnpaidInterest}
      />

      {/* Modals */}
      <InvestorModal
        isOpen={showInvestorModal}
        onClose={() => setShowInvestorModal(false)}
        onSave={handleSaveInvestor}
        investor={selectedInvestor}
        editMode={editMode}
      />

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

      <InvestorHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        investors={processedInvestors}
      />
    </div>
  );
};

export default Investors;
