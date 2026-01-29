import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCustomer } from "../Context/CustomerContext";
import { toast } from "react-toastify";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import { exportInvestorPDF } from "../utils/investorUtils";
import { useBranch } from "../Context/BranchContext";
import { useAuth } from "../Context/AuthContext";

const AddInvestor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();
  const { customers, upsertCustomer, fetchInvestors, fetchCustomers } =
    useCustomer();
  const { branches, getBranches } = useBranch();
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Check if we are in edit mode
  const editInvestorData = location.state?.investor;
  const isEditMode = !!editInvestorData;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    investorType: "individual",
    panNumber: "",
    aadharNumber: "",
    kycStatus: "pending",
    preferredPayoutMode: "cash",
    bankAccounts: [
      {
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifsc: "",
        isDefault: true,
      },
    ],
    upiAccounts: [
      {
        upiId: "",
        upiPhone: "",
        isDefault: true,
      },
    ],
    principalAmount: "",
    interestRate: "",
    interestType: "simple",
    startDate: new Date().toISOString().split("T")[0],
    status: "active",
    paymentAccountId: "",
    branchId: "",
  });

  useEffect(() => {
    fetchCustomers();
    if (!isEditMode) {
      getBranches();
    }
  }, [isEditMode, getBranches, fetchCustomers]);

  useEffect(() => {
    const fetchBranchAccounts = async () => {
      if (!formData.branchId || !accessToken) return;
      try {
        setIsLoadingAccounts(true);
        const res = await axios.get(
          API_ENDPOINTS.BRANCH_BY_ID_ACCOUNTS(formData.branchId),
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (res.data.success) {
          const validAccounts = res.data.data.filter(
            (acc) => acc.type !== "Credits",
          );
          setAccounts(validAccounts);
          // Auto-select Cash if current selection is invalid or empty
          const cashAcc = validAccounts.find((a) => a.type === "Cash");
          const isStillValid = validAccounts.some(
            (acc) => acc._id === formData.paymentAccountId,
          );
          if (!isStillValid) {
            setFormData((prev) => ({
              ...prev,
              paymentAccountId: cashAcc ? cashAcc._id : "",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch branch accounts", err);
        setAccounts([]);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    if (!isEditMode && formData.branchId) {
      fetchBranchAccounts();
    }
  }, [formData.branchId, isEditMode, accessToken]);

  useEffect(() => {
    if (editInvestorData) {
      setFormData({
        name: editInvestorData.name,
        phone: editInvestorData.phone,
        email: editInvestorData.email || "",
        investorType: editInvestorData.investorType || "individual",
        panNumber: editInvestorData.panNumber || "",
        aadharNumber: editInvestorData.aadharNumber || "",
        kycStatus: editInvestorData.kycStatus || "pending",
        preferredPayoutMode: editInvestorData.preferredPayoutMode || "cash",
        bankAccounts: editInvestorData.bankAccounts || [
          {
            accountHolderName: "",
            bankName: "",
            accountNumber: "",
            ifsc: "",
            isDefault: true,
          },
        ],
        upiAccounts: editInvestorData.upiAccounts || [
          {
            upiId: "",
            upiPhone: "",
            isDefault: true,
          },
        ],
        principalAmount: editInvestorData.principalAmount,
        interestRate: editInvestorData.interestRate,
        interestType: editInvestorData.interestType,
        startDate: editInvestorData.startDate,
        status: editInvestorData.status,
        branchId: editInvestorData.branchId || editInvestorData.branch || "",
      });
    }
  }, [editInvestorData]);

  const handleBankChange = (index, field, value) => {
    const updatedAccounts = [...formData.bankAccounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setFormData((prev) => ({ ...prev, bankAccounts: updatedAccounts }));
  };

  const addBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        {
          accountHolderName: "",
          bankName: "",
          accountNumber: "",
          ifsc: "",
          isDefault: false,
        },
      ],
    }));
  };

  const removeBankAccount = (index) => {
    if (formData.bankAccounts.length > 1) {
      const updatedAccounts = formData.bankAccounts.filter(
        (_, i) => i !== index,
      );
      setFormData((prev) => ({ ...prev, bankAccounts: updatedAccounts }));
    }
  };

  const handleUpiChange = (index, field, value) => {
    const updatedAccounts = [...formData.upiAccounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setFormData((prev) => ({ ...prev, upiAccounts: updatedAccounts }));
  };

  const addUpiAccount = () => {
    setFormData((prev) => ({
      ...prev,
      upiAccounts: [
        ...prev.upiAccounts,
        {
          upiId: "",
          upiPhone: "",
          isDefault: false,
        },
      ],
    }));
  };

  const removeUpiAccount = (index) => {
    if (formData.upiAccounts.length > 1) {
      const updatedAccounts = formData.upiAccounts.filter(
        (_, i) => i !== index,
      );
      setFormData((prev) => ({ ...prev, upiAccounts: updatedAccounts }));
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectCustomer = (customer) => {
    // Check if they already have investor details to pre-fill bank/upi
    const existingDetails = customer.investmentDetails?.[0] || {};

    setFormData((prev) => ({
      ...prev,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || prev.email,
      city: customer.city || prev.city,
      investorType: existingDetails.investorType || prev.investorType,
      panNumber: existingDetails.panNumber || prev.panNumber,
      aadharNumber: existingDetails.aadharNumber || prev.aadharNumber,
      kycStatus: existingDetails.kycStatus || prev.kycStatus,
      preferredPayoutMode:
        existingDetails.preferredPayoutMode || prev.preferredPayoutMode,
      bankAccounts:
        existingDetails.bankAccounts?.length > 0
          ? existingDetails.bankAccounts
          : prev.bankAccounts,
      upiAccounts:
        existingDetails.upiAccounts?.length > 0
          ? existingDetails.upiAccounts
          : prev.upiAccounts,
      branchId: customer.branchId || customer.branch || prev.branchId,
    }));
    setSelectedCustomerId(customer._id);
    setSearchTerm("");
    setShowSuggestions(false);
    toast.info(
      customer.role === "customer"
        ? "Existing customer data linked!"
        : "Existing investor data linked! Payout details pre-filled.",
    );
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.phone.includes(searchTerm),
      )
      .slice(0, 5);
  }, [customers, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: isEditMode ? editInvestorData?.customerId : selectedCustomerId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || "",
        city: formData.city || "",
        role: "Investor",
        branchId: formData.branchId,
        initialPaymentAccountId: formData.paymentAccountId,
        investorDetails: {
          ...formData,
          _id:
            isEditMode && editInvestorData?.investmentId
              ? editInvestorData.investmentId
              : undefined,
          id:
            isEditMode && editInvestorData?.investmentId
              ? editInvestorData.investmentId
              : undefined,
          currentPrincipal:
            isEditMode && editInvestorData?.currentPrincipal !== undefined
              ? editInvestorData.currentPrincipal
              : formData.principalAmount,
          interestHistory:
            isEditMode && editInvestorData?.interestHistory
              ? editInvestorData.interestHistory
              : [],
          payoutHistory:
            isEditMode && editInvestorData?.payoutHistory
              ? editInvestorData.payoutHistory
              : [],
          investments:
            isEditMode && editInvestorData?.investments
              ? editInvestorData.investments
              : [
                  {
                    date: formData.startDate,
                    amount: formData.principalAmount,
                    type: "initial",
                  },
                ],
          unpaidInterest:
            isEditMode && editInvestorData?.unpaidInterest !== undefined
              ? editInvestorData.unpaidInterest
              : 0,
          lastAccrualDate:
            isEditMode && editInvestorData?.lastAccrualDate
              ? editInvestorData.lastAccrualDate
              : undefined,
          totalInterestPaid:
            isEditMode && editInvestorData?.totalInterestPaid !== undefined
              ? editInvestorData.totalInterestPaid
              : 0,
        },
      };

      const result = await upsertCustomer(payload);
      if (result) {
        toast.success(
          isEditMode
            ? "Investor updated successfully"
            : "Investor added successfully",
        );
        if (!isEditMode) {
          const newInvestment =
            result.investmentDetails?.[result.investmentDetails.length - 1];
          const selectedBranch = branches.find(
            (b) => b._id === formData.branchId,
          );
          exportInvestorPDF(
            {
              ...formData,
              certNo: newInvestment?.certNo,
            },
            selectedBranch,
          );
        }
        fetchInvestors();
        navigate("/investors");
      }
    } catch (err) {
      console.error("Failed to save investor:", err);
      toast.error("Failed to save investor details");
    }
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
            <i
              className={`bi ${isEditMode ? "bi-pencil-square" : "bi-person-plus-fill"} text-primary me-2`}
            ></i>
            {isEditMode ? "Edit Investor" : "Add New Investor"}
          </h2>
          <p className="text-muted mb-0">
            {isEditMode
              ? "Update investor information and payout details"
              : "Register a new investor and set up investment terms"}
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-primary text-white p-3">
              <h5 className="mb-0 fw-bold">Investor Information</h5>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body p-4">
                {!isEditMode && (
                  <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25">
                    <label className="form-label fw-bold small text-primary">
                      <i className="bi bi-search me-2"></i>
                      Search Existing Customer
                    </label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                      />
                      {showSuggestions && filteredCustomers.length > 0 && (
                        <div className="list-group position-absolute w-100 shadow-lg z-3 mt-1">
                          {filteredCustomers.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onClick={() => handleSelectCustomer(c)}
                            >
                              <div>
                                <div className="fw-bold">{c.name}</div>
                                <small className="text-muted">{c.phone}</small>
                              </div>
                              <span className="badge bg-primary rounded-pill">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <small className="text-muted mt-1 d-block">
                      Link an existing customer to convert them to an investor.
                    </small>
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Investor Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Investor Type
                    </label>
                    <select
                      className="form-select"
                      value={formData.investorType}
                      onChange={(e) =>
                        handleChange("investorType", e.target.value)
                      }
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Select Branch <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.branchId}
                      onChange={(e) => handleChange("branchId", e.target.value)}
                      required
                    >
                      <option value="">Choose Branch...</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {!isEditMode && (
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Received To Account{" "}
                        <span className="text-danger">*</span>
                        {!formData.branchId && (
                          <span className="text-warning ms-2 small">
                            (Select branch first)
                          </span>
                        )}
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {isLoadingAccounts ? (
                          <div className="text-muted small">
                            Loading accounts...
                          </div>
                        ) : accounts.length > 0 ? (
                          accounts.map((acc) => (
                            <button
                              key={acc._id}
                              type="button"
                              disabled={acc.currentStatus === "Closed"}
                              onClick={() =>
                                handleChange("paymentAccountId", acc._id)
                              }
                              className={`btn btn-sm px-3 fw-bold py-2 transition-all ${
                                formData.paymentAccountId === acc._id
                                  ? "btn-success shadow"
                                  : "btn-light border text-secondary"
                              }`}
                            >
                              <i
                                className={`bi ${acc.type === "Upi" ? "bi-qr-code" : acc.type === "Cash" ? "bi-cash" : "bi-bank"} me-1`}
                              ></i>
                              {acc.type}{" "}
                              {acc.currentStatus === "Closed" && "(Closed)"}
                            </button>
                          ))
                        ) : (
                          <div className="text-muted small">
                            {formData.branchId
                              ? "No active accounts found for this branch."
                              : "Please select a branch to view accounts."}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.panNumber}
                      onChange={(e) =>
                        handleChange("panNumber", e.target.value.toUpperCase())
                      }
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.aadharNumber}
                      onChange={(e) =>
                        handleChange("aadharNumber", e.target.value)
                      }
                      placeholder="12-digit Aadhar Number"
                      maxLength={12}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      KYC Status
                    </label>
                    <select
                      className="form-select"
                      value={formData.kycStatus}
                      onChange={(e) =>
                        handleChange("kycStatus", e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Principal Amount (₹){" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${isEditMode ? "bg-light" : ""}`}
                      value={formData.principalAmount}
                      onChange={(e) =>
                        handleChange(
                          "principalAmount",
                          parseFloat(e.target.value),
                        )
                      }
                      required
                      min="0"
                      step="1"
                      disabled={isEditMode}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Interest Rate (Paise per ₹1/month){" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${isEditMode ? "bg-light" : ""}`}
                      value={formData.interestRate}
                      onChange={(e) =>
                        handleChange("interestRate", parseFloat(e.target.value))
                      }
                      required
                      min="0"
                      step="0.01"
                      disabled={isEditMode}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Interest Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${isEditMode ? "bg-light" : ""}`}
                      value={formData.interestType}
                      onChange={(e) =>
                        handleChange("interestType", e.target.value)
                      }
                      disabled={isEditMode}
                    >
                      <option value="simple">Simple Interest</option>
                      <option value="compound">Compound Interest</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">
                      Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${isEditMode ? "bg-light" : ""}`}
                      value={formData.startDate}
                      onChange={(e) =>
                        handleChange("startDate", e.target.value)
                      }
                      required
                      disabled={isEditMode}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="card bg-light border-0 mt-4 p-3 rounded-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-bank me-2"></i>Bank Accounts
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary fw-bold"
                      onClick={addBankAccount}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Bank
                    </button>
                  </div>
                  <div className="row g-3">
                    {formData.bankAccounts.map((account, index) => (
                      <div key={index} className="col-12">
                        <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-light text-dark fw-bold">
                              Account #{index + 1}
                            </span>
                            {formData.bankAccounts.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm text-danger"
                                onClick={() => removeBankAccount(index)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                          <div className="row g-2">
                            <div className="col-md-6">
                              <label className="form-label small text-muted mb-1">
                                Account Holder
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={account.accountHolderName}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "accountHolderName",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small text-muted mb-1">
                                Bank Name
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={account.bankName}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "bankName",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small text-muted mb-1">
                                Account Number
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={account.accountNumber}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "accountNumber",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small text-muted mb-1">
                                IFSC Code
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={account.ifsc}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "ifsc",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card bg-light border-0 mt-4 p-3 rounded-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-phone me-2"></i>UPI Details
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary fw-bold"
                      onClick={addUpiAccount}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add UPI
                    </button>
                  </div>
                  <div className="row g-3">
                    {formData.upiAccounts.map((account, index) => (
                      <div key={index} className="col-12">
                        <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-light text-dark fw-bold">
                              UPI #{index + 1}
                            </span>
                            {formData.upiAccounts.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm text-danger"
                                onClick={() => removeUpiAccount(index)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                          <div className="row g-2">
                            <div className="col-md-6">
                              <label className="form-label small text-muted mb-1">
                                UPI ID
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={account.upiId}
                                onChange={(e) =>
                                  handleUpiChange(
                                    index,
                                    "upiId",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small text-muted mb-1">
                                UPI Phone
                              </label>
                              <input
                                type="tel"
                                className="form-control form-control-sm"
                                value={account.upiPhone}
                                onChange={(e) =>
                                  handleUpiChange(
                                    index,
                                    "upiPhone",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card-footer bg-light p-4 text-end">
                <button
                  type="button"
                  className="btn btn-secondary fw-bold px-4 me-2"
                  onClick={() => navigate("/investors")}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary fw-bold px-4">
                  <i className="bi bi-save me-2"></i>
                  {isEditMode ? "Update Investor" : "Add Investor"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-primary bg-opacity-10 mb-4">
            <div className="card-body p-4 text-center">
              <div className="mb-3">
                <i className="bi bi-calculator fs-1 text-primary"></i>
              </div>
              <h5 className="fw-bold text-primary mb-3">Interest Summary</h5>
              <div className="row g-3">
                <div className="col-6">
                  <div className="bg-white p-3 rounded-3 shadow-sm h-100">
                    <p className="small text-muted mb-1">Monthly</p>
                    <h6 className="fw-bold mb-0">
                      ₹
                      {formData.principalAmount && formData.interestRate
                        ? (
                            (formData.principalAmount * formData.interestRate) /
                            100
                          ).toFixed(2)
                        : "0.00"}
                    </h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white p-3 rounded-3 shadow-sm h-100">
                    <p className="small text-muted mb-1">Yearly</p>
                    <h6 className="fw-bold mb-0">
                      ₹
                      {formData.principalAmount && formData.interestRate
                        ? (
                            (formData.principalAmount *
                              formData.interestRate *
                              12) /
                            100
                          ).toFixed(2)
                        : "0.00"}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 text-center">
              <div className="mb-3">
                <i className="bi bi-shield-check fs-1 text-success"></i>
              </div>
              <h5 className="fw-bold text-success mb-2">Secure Investment</h5>
              <p className="text-muted small">
                All investment data is encrypted and securely stored.
                Certificates are automatically generated upon successful
                registration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddInvestor;
