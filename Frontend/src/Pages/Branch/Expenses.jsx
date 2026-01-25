import axios from "axios";
import { API_ENDPOINTS } from "../../config/api.jsx";
import "../../Styles/Expenses.css";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const Expenses = () => {
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Product");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [branchEmployees, setBranchEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [branchDetails, setBranchDetails] = useState(null);
  const [employeeSummary, setEmployeeSummary] = useState(null);
  const [expenseHistory, setExpenseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // Current month
  const [filterYear, setFilterYear] = useState(new Date().getFullYear()); // Current year
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Hash-based routing using useLocation
  useEffect(() => {
    const hash = location.hash.replace("#", "");

    // If no hash is present, default to 'product'
    if (!hash) {
      navigate("#product", { replace: true });
      return;
    }

    const validCategories = ["Product", "Employee", "Rent", "Other"];
    const category = validCategories.find(
      (cat) => cat.toLowerCase() === hash.toLowerCase(),
    );
    if (category) {
      setSelectedCategory(category);
    }
  }, [location.hash, navigate]);

  // Fetch Expense History
  const fetchExpenses = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await axios.get(API_ENDPOINTS.EXPENSES, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        setExpenseHistory(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expense history");
    } finally {
      setLoadingHistory(false);
    }
  }, [accessToken]);

  // Handle Filtering and Pagination logic
  const months = [
    { value: 0, label: "All Months" },
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = React.useMemo(() => {
    const uniqueYears = new Set();
    uniqueYears.add(new Date().getFullYear()); // Always include current year

    expenseHistory.forEach((exp) => {
      if (exp.date) {
        uniqueYears.add(new Date(exp.date).getFullYear());
      }
    });

    return ["All", ...Array.from(uniqueYears).sort((a, b) => b - a)];
  }, [expenseHistory]);

  const filteredExpenses = expenseHistory.filter((exp) => {
    const expDate = new Date(exp.date);
    const mMatch = filterMonth === 0 || expDate.getMonth() + 1 === filterMonth;
    const yMatch =
      filterYear === "All" || expDate.getFullYear() === parseInt(filterYear);
    return mMatch && yMatch;
  });

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filterMonth, filterYear]);

  // Fetch Payment Accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const res = await axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.success) {
          setAccounts(res.data.data || []);
          // Set default payment mode if available
          if (res.data.data?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              paymentMode: res.data.data[0]._id,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (!accessToken) return;
    fetchAccounts();
    fetchExpenses();
  }, [fetchExpenses, accessToken]);

  // Fetch Branch Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user?.branchCode || !accessToken) return;
      try {
        setLoadingEmployees(true);
        const res = await axios.get(API_ENDPOINTS.EMPLOYEES(user.branchCode), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.success) {
          setBranchEmployees(res.data.employees || []);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [user?.branchCode]);

  // Fetch Branch Details
  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (!user?.branchCode || !accessToken) return;
      try {
        const res = await axios.get(
          API_ENDPOINTS.BRANCH + `/${user.branchCode}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (res.data.success) {
          setBranchDetails(res.data.branch);
        }
      } catch (error) {
        console.error("Error fetching branch details:", error);
      }
    };

    fetchBranchDetails();
  }, [user?.branchCode]);

  useEffect(() => {
    if (user && branchDetails) {
      const isRented = branchDetails.OwnerShip === "Rented";
      const isLeased = branchDetails.OwnerShip === "Leased";

      setFormData((prev) => ({
        ...prev,
        employeeName: user.name,
        payPerDay: user.PayPerDay || "",
        propertyName: branchDetails.name,
        rentAmount: isRented
          ? branchDetails.rentdetails?.rentamount || ""
          : isLeased
            ? branchDetails.leasedetails?.Leasedamount || ""
            : "",
        landlord: isLeased
          ? branchDetails.leasedetails?.leaseholdername || ""
          : isRented
            ? "Property Owner"
            : "N/A",
      }));
    }
  }, [user, branchDetails]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    navigate(`/expenses#${category.toLowerCase()}`);
  };

  const [formData, setFormData] = useState({
    productEntryType: "single",
    productName: "",
    quantity: "",
    unitPrice: "",
    supplier: "",
    employeePaymentType: "salary",
    employeeName: "",
    salary: "",
    daysWorked: "",
    payPerDay: "",
    salaryFromDate: "",
    salaryToDate: "",
    advance: "",
    bonus: "",
    deductions: "",
    propertyName: "",
    rentAmount: "",
    period: "",
    landlord: "",
    description: "",
    amount: "",
    category: "",
    paymentMode: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Removed static expenseHistory

  const categories = [
    { id: "Product", label: "Product", icon: "bi-box-seam", color: "#6366f1" },
    {
      id: "Employee",
      label: "Employee",
      icon: "bi-person-badge",
      color: "#10b981",
    },
    { id: "Rent", label: "Rent", icon: "bi-house-door", color: "#f59e0b" },
    { id: "Other", label: "Other", icon: "bi-three-dots", color: "#8b5cf6" },
  ];

  const stats = [
    {
      label: "Total Spent",
      value: expenseHistory.reduce((sum, exp) => sum + exp.amount, 0),
      icon: "bi-currency-rupee",
      color: "blue",
      bg: "rgba(99, 102, 241, 0.1)",
    },
    {
      label: "Product Cost",
      value: expenseHistory
        .filter((e) => e.category === "Product")
        .reduce((sum, exp) => sum + exp.amount, 0),
      icon: "bi-box",
      color: "indigo",
      bg: "rgba(99, 102, 241, 0.1)",
    },
    {
      label: "Employee Pay",
      value: expenseHistory
        .filter((e) => e.category === "Employee")
        .reduce((sum, exp) => sum + exp.amount, 0),
      icon: "bi-people",
      color: "green",
      bg: "rgba(16, 185, 129, 0.1)",
    },
    {
      label: "Operational",
      value: expenseHistory
        .filter((e) => e.category === "Rent" || e.category === "Other")
        .reduce((sum, exp) => sum + exp.amount, 0),
      icon: "bi-building",
      color: "red",
      bg: "rgba(245, 158, 11, 0.1)",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate base salary if days or pay per day changes
      if (field === "daysWorked" || field === "payPerDay") {
        const days = parseFloat(newData.daysWorked) || 0;
        const pay = parseFloat(newData.payPerDay) || 0;
        newData.salary = (days * pay).toString();
      }

      // Auto-calculate days worked if date range changes
      if (field === "salaryFromDate" || field === "salaryToDate") {
        if (newData.salaryFromDate && newData.salaryToDate) {
          const start = new Date(newData.salaryFromDate);
          const end = new Date(newData.salaryToDate);
          const diffTime = end - start;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          if (diffDays > 0) {
            newData.daysWorked = diffDays.toString();
            // Also trigger salary update
            const pay = parseFloat(newData.payPerDay) || 0;
            newData.salary = (diffDays * pay).toString();
          }
        }
      }

      return newData;
    });
  };

  const fetchEmployeeSummary = async (name) => {
    if (!name || !accessToken) return;
    try {
      const res = await axios.get(
        API_ENDPOINTS.EMPLOYEE_EXPENSE_SUMMARY(name),
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (res.data.success) {
        setEmployeeSummary(res.data.data);
        // Auto-fill deductions if there's a pending advance and we are in salary mode
        if (
          formData.employeePaymentType === "salary" &&
          res.data.data.pendingAdvance > 0
        ) {
          setFormData((prev) => ({
            ...prev,
            deductions: res.data.data.pendingAdvance.toString(),
          }));
          toast.info(
            `Auto-applied deduction for pending advance: ₹${res.data.data.pendingAdvance}`,
          );
        }
      }
    } catch (error) {
      console.error("Error fetching employee summary:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.paymentMode) {
      toast.warning("Please select a payment account");
      return;
    }

    // Frontend Overlap Check
    if (
      selectedCategory === "Employee" &&
      formData.employeePaymentType === "salary"
    ) {
      const start = new Date(formData.salaryFromDate);
      const end = new Date(formData.salaryToDate);

      const overlap = expenseHistory.find(
        (exp) =>
          exp.category === "Employee" &&
          exp.metadata.employeeName === formData.employeeName &&
          exp.metadata.employeePaymentType === "salary" &&
          new Date(exp.metadata.salaryFromDate) <= end &&
          new Date(exp.metadata.salaryToDate) >= start,
      );

      if (overlap) {
        toast.error(
          `Error: Salary for ${formData.employeeName} already recorded for this period.`,
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Calculate total amount based on category
      let totalAmount = 0;
      let description = "";
      let metadata = {};

      if (selectedCategory === "Product") {
        totalAmount =
          formData.productEntryType === "single"
            ? (parseFloat(formData.quantity) || 0) *
              (parseFloat(formData.unitPrice) || 0)
            : parseFloat(formData.unitPrice) || 0;
        description =
          formData.productEntryType === "single"
            ? `Product: ${formData.productName} (x${formData.quantity})`
            : `Bulk Order: ${formData.productName}`;
        metadata = {
          productName: formData.productName,
          quantity: parseFloat(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          supplier: formData.supplier,
          productEntryType: formData.productEntryType,
        };
      } else if (selectedCategory === "Employee") {
        const base = parseFloat(formData.salary) || 0;
        const bonus = parseFloat(formData.bonus) || 0;
        const ded = parseFloat(formData.deductions) || 0;
        const adv = parseFloat(formData.advance) || 0;

        if (formData.employeePaymentType === "salary") {
          totalAmount = base + bonus - ded;
          description = `Salary: ${formData.employeeName} (${formData.daysWorked} days)`;
        } else {
          totalAmount = adv;
          description = `Advance: ${formData.employeeName}`;
        }

        metadata = {
          employeeName: formData.employeeName,
          employeePaymentType: formData.employeePaymentType,
          daysWorked: parseFloat(formData.daysWorked),
          payPerDay: parseFloat(formData.payPerDay),
          salaryFromDate: formData.salaryFromDate,
          salaryToDate: formData.salaryToDate,
          salary: base,
          bonus: bonus,
          deductions: ded,
          advance: adv,
        };
      } else if (selectedCategory === "Rent") {
        totalAmount = parseFloat(formData.rentAmount) || 0;
        description = `Rent: ${formData.propertyName} - ${formData.period}`;
        metadata = {
          propertyName: formData.propertyName,
          rentPeriod: formData.period,
          landlord: formData.landlord,
        };
      } else {
        totalAmount = parseFloat(formData.amount) || 0;
        description = formData.description;
        metadata = {
          otherCategory: formData.category,
        };
      }

      const payload = {
        category: selectedCategory,
        description,
        amount: totalAmount,
        paymentAccount: formData.paymentMode,
        date: formData.date,
        metadata,
        notes: formData.notes,
      };

      const res = await axios.post(API_ENDPOINTS.EXPENSES, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.success) {
        toast.success("Expense recorded successfully");
        fetchExpenses(); // Refresh list
        // Reset form
        setFormData({
          productEntryType: "single",
          productName: "",
          quantity: "",
          unitPrice: "",
          supplier: "",
          employeePaymentType: "salary",
          employeeName: "",
          salary: "",
          daysWorked: "",
          payPerDay: "",
          salaryFromDate: "",
          salaryToDate: "",
          advance: "",
          bonus: "",
          deductions: "",
          propertyName: "",
          rentAmount: "",
          period: "",
          landlord: "",
          description: "",
          amount: "",
          category: "",
          paymentMode: accounts[0]?._id || "",
          date: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "Failed to record expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryForm = () => {
    switch (selectedCategory) {
      case "Product":
        return (
          <div className="row g-4 animate-fade-in">
            <div className="col-12">
              <label className="premium-form-label">Entry Type</label>
              <div
                className="category-selector"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <button
                  type="button"
                  className={`category-btn w-50 justify-content-center ${formData.productEntryType === "single" ? "active product" : ""}`}
                  onClick={() =>
                    handleInputChange("productEntryType", "single")
                  }
                >
                  <i className="bi bi-box"></i> Single Item
                </button>
                <button
                  type="button"
                  className={`category-btn w-50 justify-content-center ${formData.productEntryType === "bulk" ? "active product" : ""}`}
                  onClick={() => handleInputChange("productEntryType", "bulk")}
                >
                  <i className="bi bi-boxes"></i> Bulk Order
                </button>
              </div>
            </div>

            {formData.productEntryType === "single" ? (
              <>
                <div className="col-md-6">
                  <label className="premium-form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-control premium-input text-capitalize"
                    value={formData.productName}
                    onChange={(e) =>
                      handleInputChange("productName", e.target.value)
                    }
                    placeholder="e.g. Printer Paper Bundle"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="premium-form-label">Qty</label>
                  <input
                    type="number"
                    className="form-control premium-input"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleInputChange("quantity", e.target.value)
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="premium-form-label">Unit Price</label>
                  <div className="input-group">
                    <span className="input-group-text border-0">
                      ₹
                      <input
                        type="number"
                        className="form-control premium-input border-0"
                        value={formData.unitPrice}
                        onChange={(e) =>
                          handleInputChange("unitPrice", e.target.value)
                        }
                        placeholder="0.00"
                        required
                      />{" "}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="premium-form-label">Supplier / Store</label>
                  <input
                    type="text"
                    className="form-control premium-input"
                    value={formData.supplier}
                    onChange={(e) =>
                      handleInputChange("supplier", e.target.value)
                    }
                    placeholder="Where did you buy it?"
                  />
                </div>
                <div className="col-md-6">
                  <label className="premium-form-label">Estimated Total</label>
                  <div
                    className="stat-box p-2 bg-light border-0"
                    style={{ height: "45px" }}
                  >
                    <div className="fw-bold fs-5 text-indigo ms-2">
                      ₹{" "}
                      {(
                        (parseFloat(formData.quantity) || 0) *
                        (parseFloat(formData.unitPrice) || 0)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-12">
                  <label className="premium-form-label">
                    Detailed Description
                  </label>
                  <textarea
                    className="form-control premium-input"
                    rows="3"
                    value={formData.productName}
                    onChange={(e) =>
                      handleInputChange("productName", e.target.value)
                    }
                    placeholder="List products: 50 Pens, 10 Reams Paper, 5 Staplers..."
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="premium-form-label">
                    Total Amount Paid
                  </label>
                  <div className="input-group">
                    <span className="input-group-text input-group-text-premium me-2">
                      ₹
                      <input
                        type="number"
                        className="form-control  input-group-text-premium  premium-input border-0"
                        value={formData.unitPrice}
                        onChange={(e) =>
                          handleInputChange("unitPrice", e.target.value)
                        }
                        placeholder="0.00"
                        required
                      />{" "}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="premium-form-label">Supplier Name</label>
                  <input
                    type="text"
                    className="form-control premium-input"
                    value={formData.supplier}
                    onChange={(e) =>
                      handleInputChange("supplier", e.target.value)
                    }
                    placeholder="Vendor Name"
                  />
                </div>
              </>
            )}
          </div>
        );

      case "Employee":
        return (
          <div className="row g-4 animate-fade-in">
            <div className="col-12">
              <label className="premium-form-label">Payment Type</label>
              <div
                className="category-selector"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <button
                  type="button"
                  className={`category-btn w-50 justify-content-center ${formData.employeePaymentType === "salary" ? "active employee" : ""}`}
                  onClick={() =>
                    handleInputChange("employeePaymentType", "salary")
                  }
                >
                  <i className="bi bi-person-check"></i> Salary
                </button>
                <button
                  type="button"
                  className={`category-btn w-50 justify-content-center ${formData.employeePaymentType === "advance" ? "active employee" : ""}`}
                  onClick={() =>
                    handleInputChange("employeePaymentType", "advance")
                  }
                >
                  <i className="bi bi-wallet2"></i> Advance
                </button>
              </div>
            </div>

            <div className="col-md-6">
              <label className="premium-form-label">Beneficiary Employee</label>
              <select
                className="form-select premium-input"
                value={formData.employeeName}
                onChange={(e) => {
                  const emp = branchEmployees.find(
                    (b) => b.name === e.target.value,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    employeeName: e.target.value,
                    payPerDay: emp?.PayPerDay || "",
                  }));
                  fetchEmployeeSummary(e.target.value);
                }}
                required
              >
                <option value="">Select Employee...</option>
                {branchEmployees.map((emp) => (
                  <option key={emp._id} value={emp.name}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="premium-form-label">Executing Branch</label>
              <input
                type="text"
                className="form-control premium-input bg-light"
                value={user?.branchCode || "---"}
                readOnly
              />
            </div>

            {formData.employeePaymentType === "salary" ? (
              <>
                <div className="col-md-3">
                  <label className="premium-form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control premium-input"
                    value={formData.salaryFromDate}
                    onChange={(e) =>
                      handleInputChange("salaryFromDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="premium-form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control premium-input"
                    value={formData.salaryToDate}
                    onChange={(e) =>
                      handleInputChange("salaryToDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="premium-form-label">Days Worked</label>
                  <input
                    type="number"
                    className="form-control premium-input"
                    value={formData.daysWorked}
                    onChange={(e) =>
                      handleInputChange("daysWorked", e.target.value)
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="premium-form-label">Pay Per Day</label>
                  <div className="input-group">
                    <span className="input-group-text border-0 ps-3 bg-light text-muted">
                      ₹
                      <input
                        type="number"
                        className="form-control premium-input border-0 bg-light"
                        value={formData.payPerDay}
                        onChange={(e) =>
                          handleInputChange("payPerDay", e.target.value)
                        }
                        placeholder="0.00"
                        required
                      />{" "}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="premium-form-label">
                    Base Salary (Total)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text input-group-text-premium">
                      ₹
                      <input
                        type="number"
                        className="form-control premium-input border-0 input-group-text-premium"
                        value={formData.salary}
                        readOnly
                        placeholder="Computed automatically"
                      />{" "}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="premium-form-label">
                    Bonus / Incentives
                  </label>
                  <div className="input-group">
                    <span className="input-group-text input-group-text-premium">
                      ₹
                      <input
                        type="number"
                        className="form-control premium-input border-0 input-group-text-premium"
                        value={formData.bonus}
                        onChange={(e) =>
                          handleInputChange("bonus", e.target.value)
                        }
                        placeholder="0.00"
                      />{" "}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="premium-form-label">Deductions</label>
                  <div className="input-group">
                    <span className="input-group-text input-group-text-premium">
                      ₹
                      <input
                        type="number"
                        className="form-control premium-input border-0 input-group-text-premium"
                        value={formData.deductions}
                        onChange={(e) =>
                          handleInputChange("deductions", e.target.value)
                        }
                        placeholder="0.00"
                      />{" "}
                    </span>
                  </div>
                </div>
                <div className="col-12">
                  <div
                    className="stat-box py-3 border-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    }}
                  >
                    <div className="stat-icon bg-white text-success shadow-sm">
                      <i className="bi bi-cash-stack"></i>
                    </div>
                    <div>
                      <div className="stat-label text-white opacity-75">
                        Take Home Pay
                      </div>
                      <div className="stat-value text-white">
                        ₹{" "}
                        {(
                          (parseFloat(formData.salary) || 0) +
                          (parseFloat(formData.bonus) || 0) -
                          (parseFloat(formData.deductions) || 0)
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                {employeeSummary && employeeSummary.pendingAdvance > 0 && (
                  <div className="col-12 mt-3">
                    <div className="alert alert-warning border-warning d-flex align-items-center mb-0 py-2">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                      <span className="small">
                        <strong>Advance Notice:</strong> This employee has a
                        pending advance of{" "}
                        <strong>₹{employeeSummary.pendingAdvance}</strong>. This
                        amount has been automatically added to the{" "}
                        <strong>Deductions</strong> field.
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="col-md-6">
                  <label className="premium-form-label">Advance Amount</label>
                  <div className="input-group">
                    <span className="input-group-text border-0 ps-3 bg-light text-muted">
                      ₹
                   
                    <input
                      type="number"
                      className="form-control premium-input border-0 bg-light"
                      value={formData.advance}
                      onChange={(e) =>
                        handleInputChange("advance", e.target.value)
                      }
                      placeholder="0.00"
                      required
                    /> </span>
                  </div>
                </div>
                <div className="col-12">
                  <label className="premium-form-label">Reason / Term</label>
                  <textarea
                    className="form-control premium-input"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Why is this advance being issued?"
                  />
                </div>
              </>
            )}
          </div>
        );

      case "Rent":
        return (
          <div className="row g-4 animate-fade-in">
            <div className="col-md-8">
              <label className="premium-form-label">
                Property / Branch Name
              </label>
              <input
                type="text"
                className="form-control premium-input bg-light"
                value={formData.propertyName}
                readOnly
                placeholder="Shop Name or Address"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="premium-form-label">Rent Amount</label>
              <div className="input-group">
                <span className="input-group-text border-0 ps-3 bg-light text-muted">
                  ₹
                <input
                  type="number"
                  className="form-control premium-input border-0 bg-light"
                  value={formData.rentAmount}
                  readOnly
                  placeholder="0.00"
                  required
                />                </span>

              </div>
            </div>
            <div className="col-md-6">
              <label className="premium-form-label">Payment Period</label>
              <input
                type="text"
                className="form-control premium-input"
                value={formData.period}
                onChange={(e) => handleInputChange("period", e.target.value)}
                placeholder="e.g. January 2026"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="premium-form-label">Landlord Name</label>
              <input
                type="text"
                className="form-control premium-input bg-light"
                value={formData.landlord}
                readOnly
                placeholder="Full Name"
              />
            </div>
          </div>
        );

      case "Other":
        return (
          <div className="row g-4 animate-fade-in">
            <div className="col-md-8">
              <label className="premium-form-label">Expense Description</label>
              <input
                type="text"
                className="form-control premium-input"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="What was this for?"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="premium-form-label">Amount</label>
              <div className="input-group">
                <span className="input-group-text border-0 ps-3 bg-light text-muted">
                  ₹
                </span>
                <input
                  type="number"
                  className="form-control premium-input border-0 bg-light"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="col-12">
              <label className="premium-form-label">Sub-Category</label>
              <input
                type="text"
                className="form-control premium-input"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="Utilities, Maintenance, Repairs, etc."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="expenses-container">
      {/* Header & Stats Strip */}
      <div className="expenses-header mb-4 px-2">
        <h2 className="fw-bold mb-4">Product & Expenses</h2>

        <div className="row g-3">
          <div className="col-md-9">
            <div className="row g-3">
              {stats.map((stat, idx) => (
                <div className="col-md-3" key={idx}>
                  <div className="stat-box premium-card">
                    <div
                      className="stat-icon"
                      style={{ backgroundColor: stat.bg, color: stat.color }}
                    >
                      <i className={`bi ${stat.icon}`}></i>
                    </div>
                    <div>
                      <div className="stat-label">{stat.label}</div>
                      <div className="stat-value text-dark small">
                        ₹ {stat.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="stat-box premium-card border-primary"
              style={{ borderStyle: "dashed" }}
            >
              <div className="stat-icon bg-primary-light text-primary">
                <i className="bi bi-building"></i>
              </div>
              <div>
                <div className="stat-label">Active Branch</div>
                <div className="stat-value text-dark small">
                  {user?.branchCode || "---"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Top: Action Card */}
        <div className="col-12">
          <div className="premium-card d-flex flex-column p-0 overflow-hidden">
            <div className="p-4 border-bottom bg-white">
              <div className="card-title-premium mb-4">
                <i className="bi bi-plus-circle-fill text-primary fs-5"></i> Log
                New Transaction
              </div>

              <div className="category-selector">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? `active ${cat.id.toLowerCase()}` : ""}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <i className={`bi ${cat.icon}`}></i>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex-grow-1">
              {renderCategoryForm()}

              <div className="row g-4 mt-2 pt-4 border-top">
                <div className="col-md-3">
                  <label className="premium-form-label">Transaction Date</label>
                  <input
                    type="date"
                    className="form-control premium-input"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="premium-form-label">
                    Payment Account / Mode
                  </label>
                  <div className="account-selector">
                    {loadingAccounts && (
                      <div className="text-muted small p-2">
                        Loading financial accounts...
                      </div>
                    )}
                    {!loadingAccounts && accounts.length === 0 && (
                      <div className="text-danger small p-2">
                        No accounts found. Please check settings.
                      </div>
                    )}
                    {accounts.map((acc) => (
                      <button
                        key={acc._id}
                        type="button"
                        className={`account-card-btn ${formData.paymentMode === acc._id ? "active" : ""}`}
                        onClick={() =>
                          handleInputChange("paymentMode", acc._id)
                        }
                      >
                        {formData.paymentMode === acc._id && (
                          <i className="bi bi-check-lg select-icon"></i>
                        )}
                        <div className="acc-type-badge">{acc.type}</div>
                        <div className="acc-name">{acc.name}</div>
                        <div className="acc-balance">
                          ₹{acc.currentBalance?.toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="premium-form-label">
                    Notes / Additional Details
                  </label>
                  <input
                    type="text"
                    className="form-control premium-input"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Reference, Bill No, or specific purpose..."
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary px-5 py-2 fw-bold shadow-sm rounded-pill"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-2"></i> Confirm
                      Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom: History Summary */}
        <div className="col-12 mb-5">
          <div className="premium-card d-flex flex-column overflow-hidden">
            <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
              <div className="card-title-premium d-flex align-items-center gap-3">
                <i className="bi bi-clock-history text-secondary fs-5"></i>{" "}
                Recent Log
                <div className="d-flex gap-2 ms-4">
                  <select
                    className="form-select form-select-sm border-0 bg-light rounded-pill px-3"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    style={{ width: "auto", minWidth: "130px" }}
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-select form-select-sm border-0 bg-light rounded-pill px-3"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{ width: "auto", minWidth: "100px" }}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card-body p-0 overflow-auto">
              <div className="table-responsive">
                <table className="history-table w-100">
                  <thead>
                    <tr>
                      <th style={{ width: "120px" }}>Date</th>
                      <th style={{ width: "120px" }}>Category</th>
                      <th>Description</th>
                      <th style={{ width: "150px" }}>Account</th>
                      <th style={{ width: "120px" }}>Added By</th>
                      <th className="text-end" style={{ width: "150px" }}>
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingHistory && (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          Loading expense history...
                        </td>
                      </tr>
                    )}
                    {!loadingHistory && expenseHistory.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          No expenses recorded yet.
                        </td>
                      </tr>
                    )}
                    {!loadingHistory &&
                      filteredExpenses.length > 0 &&
                      paginatedExpenses.length === 0 && (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center py-5 text-muted"
                          >
                            No expenses found for the selected period.
                          </td>
                        </tr>
                      )}
                    {!loadingHistory &&
                      paginatedExpenses.map((expense) => (
                        <tr key={expense._id} className="history-row-premium">
                          <td className="fw-bold text-muted small">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`badge-premium ${
                                expense.category === "Product"
                                  ? "bg-indigo-light text-indigo"
                                  : expense.category === "Employee"
                                    ? "bg-success-light text-success"
                                    : expense.category === "Rent"
                                      ? "bg-warning-light text-warning"
                                      : "bg-purple-light text-purple"
                              }`}
                            >
                              {expense.category}
                            </span>
                          </td>
                          <td className="fw-medium text-dark">
                            {expense.description}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-credit-card-2-back text-muted small me-2"></i>
                              <span className="small fw-semibold text-secondary">
                                {expense.paymentAccount?.name || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="small text-muted">
                            By {expense.recordedBy?.name || "System"}
                          </td>
                          <td className="text-end fw-bold text-dark fs-6">
                            ₹ {expense.amount?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-light border-top mt-auto">
              <div className="d-flex align-items-center justify-content-between">
                <div className="text-muted fw-bold small">MONTHLY SNAPSHOT</div>
                <div className="fw-bold text-dark">
                  ₹{" "}
                  {filteredExpenses
                    .reduce((s, e) => s + e.amount, 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-top bg-white d-flex align-items-center justify-content-center gap-3">
                <button
                  className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center border"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                <span className="small fw-bold text-muted">
                  Page <span className="text-dark">{currentPage}</span> of{" "}
                  {totalPages}
                </span>

                <button
                  className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center border"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styled Helper Classes (Internal for badges) */}
      <style>{`
        .bg-indigo-light { background: rgba(99, 102, 241, 0.1); }
        .bg-success-light { background: rgba(16, 185, 129, 0.1); }
        .bg-warning-light { background: rgba(245, 158, 11, 0.1); }
        .bg-purple-light { background: rgba(139, 92, 246, 0.1); }
        .text-indigo { color: #4f46e5; }
        .text-purple { color: #7c3aed; }
        .text-warning { color: #d97706; }
        .history-item-premium:hover { background-color: #f8fafc; }
        .text-truncate-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Expenses;
