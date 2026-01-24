import React, { useState, useEffect, useMemo } from "react";
import { useCustomer } from "../../Context/CustomerContext";

import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

const InvestorModal = ({ isOpen, onClose, onSave, investor, editMode }) => {
  const { customers } = useCustomer();
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    paymentAccountId: "", // For initial investment reception
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          // Filter out Credits account as we don't receive money IN to credits usually
          // Or strictly Cash/Bank/UPI
          const validAccounts = res.data.data.filter(
            (acc) => acc.type !== "Credits",
          );
          setAccounts(validAccounts);
          // Auto-select Cash if available
          const cashAcc = validAccounts.find((a) => a.type === "Cash");
          if (cashAcc) {
            setFormData((prev) => ({ ...prev, paymentAccountId: cashAcc._id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    if (isOpen && !editMode) {
      fetchAccounts();
    }
  }, [isOpen, editMode]);

  useEffect(() => {
    if (investor && editMode) {
      setFormData({
        name: investor.name,
        phone: investor.phone,
        email: investor.email || "",
        investorType: investor.investorType || "individual",
        panNumber: investor.panNumber || "",
        aadharNumber: investor.aadharNumber || "",
        kycStatus: investor.kycStatus || "pending",
        preferredPayoutMode: investor.preferredPayoutMode || "cash",
        bankAccounts: investor.bankAccounts || [
          {
            accountHolderName: "",
            bankName: "",
            accountNumber: "",
            ifsc: "",
            isDefault: true,
          },
        ],
        upiAccounts: investor.upiAccounts || [
          {
            upiId: "",
            upiPhone: "",
            isDefault: true,
          },
        ],
        principalAmount: investor.principalAmount,
        interestRate: investor.interestRate,
        interestType: investor.interestType,
        startDate: investor.startDate,
        status: investor.status,
      });
    } else {
      setFormData({
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
      });
    }
  }, [investor, editMode, isOpen]);

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
    setFormData((prev) => ({
      ...prev,
      name: customer.name,
      phone: customer.phone,
      city: customer.city || "",
      // Keep other fields or reset them if needed
    }));
    setSearchTerm("");
    setShowSuggestions(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2050" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered ">
        <div className="modal-content shadow-lg border-0 rounded-4 animate-modal">
          <div className="modal-header bg-primary text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-person-plus-fill me-2"></i>
              {editMode ? "Edit Investor" : "Add New Investor"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div
              className="modal-body p-4 overflow-auto"
              style={{ maxHeight: "70vh" }}
            >
              {!editMode && (
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
                      <div className="list-group position-absolute w-100 shadow-sm z-3 mt-1">
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
                    Search and select an existing customer to convert them to an
                    investor.
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
                  <label className="form-label fw-bold small">PAN Number</label>
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
                  <label className="form-label fw-bold small">KYC Status</label>
                  <select
                    className="form-select"
                    value={formData.kycStatus}
                    onChange={(e) => handleChange("kycStatus", e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Principal Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${editMode ? "bg-light" : ""}`}
                    value={formData.principalAmount}
                    onChange={(e) =>
                      handleChange(
                        "principalAmount",
                        parseFloat(e.target.value),
                      )
                    }
                    required
                    min="0"
                    step="0.01"
                    disabled={editMode}
                  />
                </div>
                {!editMode && (
                  <div className="col-md-12">
                    <label className="form-label fw-bold small">
                      Received To Account <span className="text-danger">*</span>
                    </label>
                    <div className="d-grid gap-2 d-md-flex mb-2">
                      {accounts.map((acc) => (
                        <button
                          key={acc._id}
                          type="button"
                             disabled={
                           acc.currentStatus === "Closed"
                        }
                          onClick={() =>
                            handleChange("paymentAccountId", acc._id)
                          }
                          className={`btn btn-sm flex-fill fw-bold py-2 transition-all ${
                            formData.paymentAccountId === acc._id
                              ? "btn-success shadow border-0"
                              : "btn-light border text-secondary hover-shadow"
                          }`}
                        >
                          {acc.type === "Upi" ? (
                            <span>
                              <i className="bi bi-qr-code me-1"></i>UPI
                                {acc.currentStatus === "Closed" && " (Closed)"}
                            </span>
                          ) : acc.type === "Credits" ||
                            acc.type === "Credit" ? (
                            <span>
                              <i className="bi bi-person-badge me-1"></i>CREDIT
                                {acc.currentStatus === "Closed" && " (Closed)"}
                            </span>
                          ) : (
                            <span>
                              <i className="bi bi-cash me-1"></i>
                              {acc.type}
                                {acc.currentStatus === "Closed" && " (Closed)"}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <small className="text-muted d-block">
                      Where is the investment amount deposited?
                    </small>
                  </div>
                )}
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Interest Rate (Paise per ₹1/month){" "}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${editMode ? "bg-light" : ""}`}
                    value={formData.interestRate}
                    onChange={(e) =>
                      handleChange("interestRate", parseFloat(e.target.value))
                    }
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 2 for 2 paise per rupee"
                    disabled={editMode}
                  />
                  <small className="text-muted">
                    Ex: 2 paise per ₹1 = 2% per month
                  </small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Interest Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${editMode ? "bg-light" : ""}`}
                    value={formData.interestType}
                    onChange={(e) =>
                      handleChange("interestType", e.target.value)
                    }
                    disabled={editMode}
                  >
                    <option value="simple">Simple Interest</option>
                    <option value="compound">Compound Interest</option>
                  </select>
                  <small className="text-muted">
                    {formData.interestType === "simple"
                      ? "Interest calculated on principal only"
                      : "Interest calculated on principal + accumulated interest"}
                  </small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${editMode ? "bg-light" : ""}`}
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    required
                    disabled={editMode}
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

              {/* Bank Details Section */}
              <div className="card bg-light border-0 mt-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-bank me-2"></i>Payout & Banking Details
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold small">
                        Preferred Payout Mode
                      </label>
                      <select
                        className="form-select"
                        value={formData.preferredPayoutMode}
                        onChange={(e) =>
                          handleChange("preferredPayoutMode", e.target.value)
                        }
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                    {/* Bank Accounts Section */}
                    <>
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold small mb-0">
                            Bank Accounts
                          </label>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={addBankAccount}
                          >
                            <i className="bi bi-plus-circle me-1"></i>Add Bank
                          </button>
                        </div>
                      </div>

                      {formData.bankAccounts.map((account, index) => (
                        <div key={index} className="col-12">
                          <div className="card border p-3 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0 text-muted small fw-bold">
                                Bank Account #{index + 1}
                              </h6>
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
                                <label className="form-label small text-muted">
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
                                  placeholder="Holder Name"
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small text-muted">
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
                                  placeholder="Bank Name"
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small text-muted">
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
                                  placeholder="Account No"
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small text-muted">
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
                                  placeholder="IFSC Code"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                    <hr className="my-4" />
                    {/* UPI Accounts Section */}
                    <>
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold small mb-0">
                            UPI IDs
                          </label>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={addUpiAccount}
                          >
                            <i className="bi bi-plus-circle me-1"></i>Add UPI
                          </button>
                        </div>
                      </div>

                      {formData.upiAccounts.map((account, index) => (
                        <div key={index} className="col-12">
                          <div className="card border p-3 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0 text-muted small fw-bold">
                                UPI Account #{index + 1}
                              </h6>
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
                                <label className="form-label small text-muted">
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
                                  placeholder="e.g. name@bank"
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small text-muted">
                                  UPI Phone Number
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
                                  placeholder="10 digit number"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  </div>
                </div>
              </div>

              {/* Interest Calculation Preview */}
              {formData.principalAmount && formData.interestRate && (
                <div className="alert alert-info mt-4">
                  <h6 className="fw-bold mb-2">
                    <i className="bi bi-calculator me-2"></i>Interest Preview
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted">Monthly Interest:</small>
                      <div className="fw-bold">
                        ₹
                        {(
                          (formData.principalAmount * formData.interestRate) /
                          100
                        ).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">Yearly Interest:</small>
                      <div className="fw-bold">
                        ₹
                        {(
                          (formData.principalAmount *
                            formData.interestRate *
                            12) /
                          100
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top-0 bg-light rounded-bottom-4">
              <button
                type="button"
                className="btn btn-light text-muted fw-bold"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary fw-bold px-4">
                <i className="bi bi-save me-2"></i>
                {editMode ? "Update Investor" : "Add Investor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvestorModal;
