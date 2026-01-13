import React, { useState, useEffect } from "react";

const InvestorModal = ({ isOpen, onClose, onSave, investor, editMode }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    investorType: "individual",
    panNumber: "",
    kycStatus: "pending",
    preferredPayoutMode: "cash",
    bankDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
    },
    upiDetails: {
      upiId: "",
      upiPhone: "",
    },
    principalAmount: "",
    interestRate: "",
    interestType: "simple",
    startDate: new Date().toISOString().split("T")[0],
    status: "active",
    paymentMode: "cash",
  });

  useEffect(() => {
    if (investor && editMode) {
      setFormData({
        name: investor.name,
        phone: investor.phone,
        email: investor.email || "",
        investorType: investor.investorType || "individual",
        panNumber: investor.panNumber || "",
        kycStatus: investor.kycStatus || "pending",
        preferredPayoutMode: investor.preferredPayoutMode || "cash",
        bankDetails: investor.bankDetails || {
          accountHolderName: "",
          bankName: "",
          accountNumber: "",
          ifsc: "",
        },
        upiDetails: investor.upiDetails || {
          upiId: "",
          upiPhone: "",
        },
        principalAmount: investor.principalAmount,
        interestRate: investor.interestRate,
        interestType: investor.interestType,
        startDate: investor.startDate,
        status: investor.status,
        paymentMode: investor.paymentMode,
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        investorType: "individual",
        panNumber: "",
        kycStatus: "pending",
        preferredPayoutMode: "cash",
        bankDetails: {
          accountHolderName: "",
          bankName: "",
          accountNumber: "",
          ifsc: "",
        },
        upiDetails: {
          upiId: "",
          upiPhone: "",
        },
        principalAmount: "",
        interestRate: "",
        interestType: "simple",
        startDate: new Date().toISOString().split("T")[0],
        status: "active",
        paymentMode: "cash",
      });
    }
  }, [investor, editMode, isOpen]);

  const handleChange = (field, value) => {
    if (field.startsWith("bankDetails.")) {
      const bankField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [bankField]: value },
      }));
    } else if (field.startsWith("upiDetails.")) {
      const upiField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        upiDetails: { ...prev.upiDetails, [upiField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

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
        <div className="modal-content shadow-lg border-0 rounded-4">
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
            <div className="modal-body p-4">
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
                    className="form-control"
                    value={formData.principalAmount}
                    onChange={(e) =>
                      handleChange(
                        "principalAmount",
                        parseFloat(e.target.value)
                      )
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Interest Rate (% p.a.){" "}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.interestRate}
                    onChange={(e) =>
                      handleChange("interestRate", parseFloat(e.target.value))
                    }
                    required
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Interest Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.interestType}
                    onChange={(e) =>
                      handleChange("interestType", e.target.value)
                    }
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
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">
                    Default Payment Mode
                  </label>
                  <select
                    className="form-select"
                    value={formData.paymentMode}
                    onChange={(e) =>
                      handleChange("paymentMode", e.target.value)
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="products">Products</option>
                    <option value="reinvest">Reinvest</option>
                  </select>
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
                    {formData.preferredPayoutMode === "bank" && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">
                            Account Holder
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.bankDetails.accountHolderName}
                            onChange={(e) =>
                              handleChange(
                                "bankDetails.accountHolderName",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.bankDetails.bankName}
                            onChange={(e) =>
                              handleChange(
                                "bankDetails.bankName",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">
                            Account Number
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.bankDetails.accountNumber}
                            onChange={(e) =>
                              handleChange(
                                "bankDetails.accountNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.bankDetails.ifsc}
                            onChange={(e) =>
                              handleChange("bankDetails.ifsc", e.target.value)
                            }
                          />
                        </div>
                      </>
                    )}
                    {formData.preferredPayoutMode === "upi" && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">
                            UPI ID
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.upiDetails?.upiId || ""}
                            onChange={(e) =>
                              handleChange("upiDetails.upiId", e.target.value)
                            }
                            placeholder="e.g. name@bank"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold small">
                            UPI Phone Number
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            value={formData.upiDetails?.upiPhone || ""}
                            onChange={(e) =>
                              handleChange(
                                "upiDetails.upiPhone",
                                e.target.value
                              )
                            }
                            placeholder="10 digit number"
                          />
                        </div>
                      </>
                    )}
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
                          100 /
                          12
                        ).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">Yearly Interest:</small>
                      <div className="fw-bold">
                        ₹
                        {(
                          (formData.principalAmount * formData.interestRate) /
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
