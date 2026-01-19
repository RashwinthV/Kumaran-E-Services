import React, { useState, useEffect } from "react";
import "../../Styles/dashboard.css";

const Expenses = () => {
  const [selectedCategory, setSelectedCategory] = useState("Product");

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const validCategories = ["Product", "Employee", "Rent", "Other"];
      const category = validCategories.find(
        (cat) => cat.toLowerCase() === hash.toLowerCase(),
      );
      if (category) {
        setSelectedCategory(category);
      }
    };

    // Set initial category from hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update hash when category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    window.location.hash = category.toLowerCase();
  };
  const [formData, setFormData] = useState({
    // Product fields
    productEntryType: "single", // 'single' or 'bulk'
    productName: "",
    quantity: "",
    unitPrice: "",
    supplier: "",
    // Employee fields
    employeePaymentType: "salary", // 'salary' or 'advance'
    employeeName: "",
    salary: "",
    advance: "",
    bonus: "",
    deductions: "",
    // Rent fields
    propertyName: "",
    rentAmount: "",
    period: "",
    landlord: "",
    // Other fields
    description: "",
    amount: "",
    category: "",
    // Common fields
    paymentMode: "Cash",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Hardcoded expense data
  const expenseHistory = [
    {
      id: 1,
      date: "2026-01-18",
      category: "Product",
      description: "Office Stationery - A4 Papers, Pens",
      amount: 2500,
      paymentMode: "Cash",
      addedBy: "Admin",
    },
    {
      id: 2,
      date: "2026-01-17",
      category: "Employee",
      description: "Salary - Ramesh Kumar",
      amount: 25000,
      paymentMode: "Bank",
      addedBy: "Admin",
    },
    {
      id: 3,
      date: "2026-01-15",
      category: "Rent",
      description: "Office Rent - January 2026",
      amount: 15000,
      paymentMode: "UPI",
      addedBy: "Admin",
    },
    {
      id: 4,
      date: "2026-01-14",
      category: "Other",
      description: "Electricity Bill",
      amount: 3500,
      paymentMode: "Cash",
      addedBy: "Admin",
    },
    {
      id: 5,
      date: "2026-01-12",
      category: "Product",
      description: "Printer Ink Cartridges",
      amount: 4200,
      paymentMode: "Bank",
      addedBy: "Admin",
    },
  ];

  const categories = [
    { id: "Product", label: "Product", icon: "bi-box-seam" },
    { id: "Employee", label: "Employee", icon: "bi-person-badge" },
    { id: "Rent", label: "Rent", icon: "bi-house-door" },
    { id: "Other", label: "Other", icon: "bi-three-dots" },
  ];

  const paymentModes = ["Cash", "Bank", "UPI", "Cheque"];

  const totalExpenses = expenseHistory.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Expense Data:", { ...formData, category: selectedCategory });
    // Reset form
    setFormData({
      productName: "",
      quantity: "",
      unitPrice: "",
      supplier: "",
      employeeName: "",
      salary: "",
      bonus: "",
      deductions: "",
      propertyName: "",
      rentAmount: "",
      period: "",
      landlord: "",
      description: "",
      amount: "",
      category: "",
      paymentMode: "Cash",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const renderCategoryForm = () => {
    switch (selectedCategory) {
      case "Product":
        return (
          <div className="row g-3">
            {/* Entry Type Selection */}
            <div className="col-12">
              <label className="form-label fw-bold small text-muted mb-2">
                Entry Type
              </label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${
                    formData.productEntryType === "single"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() =>
                    handleInputChange("productEntryType", "single")
                  }
                >
                  <i className="bi bi-box me-2"></i>
                  Single Entry
                </button>
                <button
                  type="button"
                  className={`btn ${
                    formData.productEntryType === "bulk"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => handleInputChange("productEntryType", "bulk")}
                >
                  <i className="bi bi-boxes me-2"></i>
                  Bulk Entry
                </button>
              </div>
            </div>

            {formData.productEntryType === "single" ? (
              <>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.productName}
                    onChange={(e) =>
                      handleInputChange("productName", e.target.value)
                    }
                    placeholder="Enter product name"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small text-muted">
                    Quantity <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleInputChange("quantity", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small text-muted">
                    Unit Price <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.unitPrice}
                      onChange={(e) =>
                        handleInputChange("unitPrice", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Supplier
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.supplier}
                    onChange={(e) =>
                      handleInputChange("supplier", e.target.value)
                    }
                    placeholder="Supplier name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Total Amount
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">₹</span>
                    <input
                      type="text"
                      className="form-control bg-light fw-bold"
                      value={(
                        (parseFloat(formData.quantity) || 0) *
                        (parseFloat(formData.unitPrice) || 0)
                      ).toFixed(2)}
                      readOnly
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-12">
                  <label className="form-label fw-bold small text-muted">
                    Bulk Products Description{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.productName}
                    onChange={(e) =>
                      handleInputChange("productName", e.target.value)
                    }
                    placeholder="e.g., Office Supplies: Pens (50 pcs), Papers (10 reams), Staplers (5 pcs)"
                  />
                  <small className="text-muted">
                    List all products with quantities
                  </small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Total Amount <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.unitPrice}
                      onChange={(e) =>
                        handleInputChange("unitPrice", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Supplier
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.supplier}
                    onChange={(e) =>
                      handleInputChange("supplier", e.target.value)
                    }
                    placeholder="Supplier name"
                  />
                </div>
              </>
            )}
          </div>
        );

      case "Employee":
        return (
          <div className="row g-3">
            {/* Payment Type Selection */}
            <div className="col-12">
              <label className="form-label fw-bold small text-muted mb-2">
                Payment Type
              </label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${
                    formData.employeePaymentType === "salary"
                      ? "btn-success"
                      : "btn-outline-success"
                  }`}
                  onClick={() =>
                    handleInputChange("employeePaymentType", "salary")
                  }
                >
                  <i className="bi bi-cash-coin me-2"></i>
                  Salary Payment
                </button>
                <button
                  type="button"
                  className={`btn ${
                    formData.employeePaymentType === "advance"
                      ? "btn-success"
                      : "btn-outline-success"
                  }`}
                  onClick={() =>
                    handleInputChange("employeePaymentType", "advance")
                  }
                >
                  <i className="bi bi-wallet2 me-2"></i>
                  Advance Payment
                </button>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">
                Employee Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.employeeName}
                onChange={(e) =>
                  handleInputChange("employeeName", e.target.value)
                }
                placeholder="Enter employee name"
              />
            </div>

            {formData.employeePaymentType === "salary" ? (
              <>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Base Salary <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.salary}
                      onChange={(e) =>
                        handleInputChange("salary", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Bonus / Incentive
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.bonus}
                      onChange={(e) =>
                        handleInputChange("bonus", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Deductions (Tax, PF, etc.)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.deductions}
                      onChange={(e) =>
                        handleInputChange("deductions", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="alert alert-info mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-calculator fs-5"></i>
                    <div>
                      <strong>Net Salary:</strong> ₹
                      {(
                        (parseFloat(formData.salary) || 0) +
                        (parseFloat(formData.bonus) || 0) -
                        (parseFloat(formData.deductions) || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">
                    Advance Amount <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.advance}
                      onChange={(e) =>
                        handleInputChange("advance", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold small text-muted">
                    Reason for Advance
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="e.g., Medical emergency, Personal loan, etc."
                  />
                </div>
              </>
            )}
          </div>
        );

      case "Rent":
        return (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">
                Property Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.propertyName}
                onChange={(e) =>
                  handleInputChange("propertyName", e.target.value)
                }
                placeholder="Office/Shop name"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">
                Rent Amount <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  className="form-control"
                  value={formData.rentAmount}
                  onChange={(e) =>
                    handleInputChange("rentAmount", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">
                Period
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.period}
                onChange={(e) => handleInputChange("period", e.target.value)}
                placeholder="e.g., January 2026"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">
                Landlord
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.landlord}
                onChange={(e) => handleInputChange("landlord", e.target.value)}
                placeholder="Landlord name"
              />
            </div>
          </div>
        );

      case "Other":
        return (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">
                Description <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Expense description"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">
                Amount <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold small text-muted">
                Category
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="e.g., Utilities, Maintenance, etc."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Product & Expenses</h2>
      </div>

      {/* Add Expense Form */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h5 className="mb-0 fw-bold">Add New Expense</h5>
        </div>
        <div className="card-body p-4">
          {/* Category Navigation */}
          <ul className="nav nav-pills mb-4 gap-2">
            {categories.map((cat) => (
              <li className="nav-item" key={cat.id}>
                <button
                  className={`nav-link d-flex align-items-center gap-2 ${
                    selectedCategory === cat.id ? "active" : ""
                  }`}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    backgroundColor:
                      selectedCategory === cat.id ? "#667eea" : "#f8f9fa",
                    color: selectedCategory === cat.id ? "white" : "#6c757d",
                    border: "none",
                    fontWeight: selectedCategory === cat.id ? "600" : "500",
                  }}
                >
                  <i className={`bi ${cat.icon}`}></i>
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Dynamic Form */}
          <form onSubmit={handleSubmit}>
            {renderCategoryForm()}

            {/* Common Fields */}
            <div className="row g-3 mt-3 pt-3 border-top">
              <div className="col-md-3">
                <label className="form-label fw-bold small text-muted">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold small text-muted">
                  Payment Mode <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.paymentMode}
                  onChange={(e) =>
                    handleInputChange("paymentMode", e.target.value)
                  }
                >
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted">
                  Notes
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="d-flex justify-content-end mt-4">
              <button
                type="submit"
                className="btn btn-primary px-4 d-flex align-items-center gap-2"
              >
                <i className="bi bi-plus-lg"></i>
                Add Expense
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h5 className="mb-0 fw-bold">Expense History</h5>
          <div className="d-flex align-items-center gap-1">
            <h4 className="text-uppercase text-muted fw-bold mb-0 small">
              Total Expenses :
            </h4>{" "}
            <h5 className="fw-bold text-dark mb-0">
              ₹ {totalExpenses.toLocaleString()}
            </h5>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 fw-bold small text-muted">DATE</th>
                  <th className="px-4 py-3 fw-bold small text-muted">
                    CATEGORY
                  </th>
                  <th className="px-4 py-3 fw-bold small text-muted">
                    DESCRIPTION
                  </th>
                  <th className="px-4 py-3 fw-bold small text-muted">AMOUNT</th>
                  <th className="px-4 py-3 fw-bold small text-muted">
                    PAYMENT MODE
                  </th>
                  <th className="px-4 py-3 fw-bold small text-muted">
                    ADDED BY
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenseHistory.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3">
                      {new Date(expense.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          expense.category === "Product"
                            ? "bg-primary"
                            : expense.category === "Employee"
                              ? "bg-success"
                              : expense.category === "Rent"
                                ? "bg-warning text-dark"
                                : "bg-secondary"
                        }`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">{expense.description}</td>
                    <td className="px-4 py-3 fw-bold">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-light text-dark border">
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{expense.addedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
