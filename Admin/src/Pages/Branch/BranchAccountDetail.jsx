import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAccount } from "../../Context/AccountContext";
import { useBranch } from "../../Context/BranchContext";
import "../../Styles/BranchAccount.css";
import { toast } from "react-toastify";
import UniversalDelete from "../../Modals/UniversalDelete";
import BackButton from "../../Components/BackButton";
import MonthYearFilter from "../../Components/MonthYearFilter";

const ITEMS_PER_PAGE = 10;

const PaginatedHistoryTable = ({
  history,
  accountName,
  isAggregated = false,
  filterMonth,
  filterYear,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterYear]);

  // Filter History
  const filteredHistory = history.filter((item) => {
    const itemDate = new Date(item.date);
    const m = itemDate.getMonth();
    const y = itemDate.getFullYear();

    const monthMatch = filterMonth === -1 || m === filterMonth;
    const yearMatch = filterYear === -1 || y === filterYear;

    return monthMatch && yearMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredHistory.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="history-table-container">
      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            {isAggregated ? <th>Account</th> : <th>Particulars</th>}
            <th>Opening</th>
            <th>Closing</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, idx) => (
              <tr key={idx}>
                <td className="td-date">
                  <i className="bi bi-calendar3"></i> {formatDate(item.date)}
                </td>
                <td className="td-account">
                  <span className="account-tag">
                    {item.accountName || accountName || "Account"}
                  </span>
                </td>
                <td className="td-amount dim">
                  {formatCurrency(item.openingBalance || 0)}
                </td>
                <td className="td-amount bold">
                  {formatCurrency(
                    item.isClosed
                      ? item.closingBalance
                      : item.expectedClosingBalance || 0
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center p-4">
                No history available for the selected period
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div
          className="pagination-controls"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "1rem",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <button
            className="btn-icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              opacity: currentPage === 1 ? 0.5 : 1,
              background: "transparent",
              border: "1px solid #ccc",
              color: "#6c757d",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span style={{ color: "#6c757d", fontSize: "0.9rem" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              opacity: currentPage === totalPages ? 0.5 : 1,
              background: "transparent",
              border: "1px solid #ccc",
              color: "#6c757d",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

const BranchAccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    accounts,
    getAccountsByBranch,
    addAccount,
    updateAccount,
    deleteAccount,
    loading: accountsLoading,
  } = useAccount();

  const { branches, getBranches } = useBranch();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [activeTab, setActiveTab] = useState("Upi"); // Upi, Cash, Credits

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form State
  const [formData, setFormData] = useState({
    type: "",
    upiAccountName: "",
    upiAccountNumber: "",
    upiId: "",
    balance: "",
    status: "Active",
  });

  // Init
  useEffect(() => {
    if (branches.length > 0) {
      const branch = branches.find((b) => b._id === id);
      if (branch) setCurrentBranch(branch);
    } else {
      getBranches();
    }
  }, [id, branches, getBranches]);

  useEffect(() => {
    getAccountsByBranch(id);
  }, [id, getAccountsByBranch]);

  // Helpers
  const getLatestBalance = (account) => {
    if (!account.balanceHistory || account.balanceHistory.length === 0)
      return account.currentBalance || 0;

    const latest = [...account.balanceHistory].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];

    // If session is still open, closingBalance is usually 0. In that case, use currentBalance.
    return latest?.isClosed ? latest.closingBalance : account.currentBalance;
  };

  const calculateTotalByType = (type) => {
    return accounts
      .filter((acc) => acc.type.toLowerCase() === type.toLowerCase())
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  };

  // const totalBalance = accounts.reduce(
  //   (sum, acc) => sum + getLatestBalance(acc.balanceHistory),
  //   0
  // );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered Accounts for current tab
  // Filtered Accounts for current tab
  const filteredAccounts = accounts.filter(
    (acc) => acc.type?.toLowerCase() === activeTab?.toLowerCase()
  );
  console.log("Filtered accounts for ", activeTab, ":", filteredAccounts);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (account = null) => {
    setEditingAccount(account);
    if (account) {
      setFormData({
        type: account.type,
        upiAccountName: account.upiAccountName || "",
        upiAccountNumber: account.upiAccountNumber || "",
        upiId: account.upiId || "",
        balance:
          account.balanceHistory?.length > 0
            ? account.balanceHistory[account.balanceHistory.length - 1]
                .closingBalance
            : "",
        status: account.status,
      });
    } else {
      setFormData({
        type: activeTab, // Default to current tab
        upiAccountName: "",
        upiAccountNumber: "",
        upiId: "",
        balance: "",
        status: "Active",
      });
    }
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: formData.type,
        upiAccountName:
          formData.type === "Upi" ? formData.upiAccountName : undefined,
        upiAccountNumber:
          formData.type === "Upi" ? formData.upiAccountNumber : undefined,
        upiId: formData.type === "Upi" ? formData.upiId : undefined,
        status: formData.status,
        branch: id,
      };

      if (!editingAccount) {
        payload.balanceHistory = [
          {
            date: new Date(),
            openingBalance: parseFloat(formData.balance) || 0,
            closingBalance: parseFloat(formData.balance) || 0,
          },
        ];
        await addAccount(payload);
      } else {
        await updateAccount(editingAccount._id, payload);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteClick = (accountId) => {
    setDeleteId(accountId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteAccount(deleteId);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const displayBranchName = currentBranch
    ? currentBranch.name
    : "Branch Details";
  const displayBranchCode = currentBranch ? currentBranch.code : "";

  return (
    <div className="account-dashboard">
      {/* 1. Header with Breadcrumb */}
      <div className="detail-header">
        <BackButton label="Back" />
        <div className="detail-title-row">
          <div>
            <h1 className="detail-title">{displayBranchName}</h1>
            <span className="detail-subtitle">
              Account Management • {displayBranchCode}
            </span>
          </div>
          <button
            className="primary-action-btn"
            onClick={() => openModal(null)}
          >
            <i className="bi bi-plus-lg"></i> Add Account
          </button>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="detail-stats-grid">
        <div
          className={`detail-stat-card ${activeTab === "Upi" ? "active" : ""}`}
          onClick={() => setActiveTab("Upi")}
        >
          <div className="stat-icon-wrapper upi">
            <i className="bi bi-phone-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total UPI</span>
            <span className="stat-value">
              {formatCurrency(calculateTotalByType("Upi"))}
            </span>
          </div>
          {activeTab === "Upi" && <div className="active-indicator"></div>}
        </div>

        <div
          className={`detail-stat-card ${activeTab === "Cash" ? "active" : ""}`}
          onClick={() => setActiveTab("Cash")}
        >
          <div className="stat-icon-wrapper cash">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Cash</span>
            <span className="stat-value">
              {formatCurrency(calculateTotalByType("Cash"))}
            </span>
          </div>
          {activeTab === "Cash" && <div className="active-indicator"></div>}
        </div>

        <div
          className={`detail-stat-card ${
            activeTab === "Credits" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Credits")}
        >
          <div className="stat-icon-wrapper credit">
            <i className="bi bi-credit-card-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label"> Credits</span>
            <span className="stat-value">
              {formatCurrency(calculateTotalByType("Credits"))}
            </span>
          </div>
          {activeTab === "Credits" && <div className="active-indicator"></div>}
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="detail-content-area">
        <div className="content-header">
          <h3>{activeTab} Accounts</h3>
          <span className="count-badge">
            {filteredAccounts.length} Accounts
          </span>
        </div>

        <div className="accounts-list-wrapper">
          {filteredAccounts.length === 0 ? (
            <div className="empty-state-small">
              No {activeTab} accounts found.
            </div>
          ) : (
            filteredAccounts.map((account) => (
              <div key={account._id} className="detail-account-card">
                <div className="acc-card-header">
                  <div className="acc-info">
                    <div className={`acc-icon icon-${activeTab.toLowerCase()}`}>
                      <i
                        className={
                          activeTab === "Upi"
                            ? "bi bi-qr-code"
                            : activeTab === "Cash"
                            ? "bi bi-safe"
                            : "bi bi-person-badge"
                        }
                      ></i>
                    </div>
                    <div>
                      <h4 className="acc-name">
                        {activeTab === "Upi"
                          ? account.upiAccountName
                          : `${activeTab} Account`}
                      </h4>
                      {activeTab === "Upi" && (
                        <div
                          className="upi-details-mini"
                          style={{
                            fontSize: "0.8rem",
                            opacity: 0.8,
                            marginTop: "4px",
                          }}
                        >
                          <div>Acc: {account.upiAccountNumber}</div>
                          <div>ID: {account.upiId}</div>
                        </div>
                      )}
                      <span
                        className={`status-badge ${account.status.toLowerCase()}`}
                      >
                        {account.status}
                      </span>
                    </div>
                  </div>
                  <div className="acc-actions">
                    <button
                      className="btn-icon"
                      onClick={() => openModal(account)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteClick(account._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="acc-balance-section">
                  <span className="label">Current Balance</span>
                  <span className="balance">
                    {formatCurrency(account.currentBalance || 0)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 4. Unified or Grouped History Section */}
        <div className="history-section">
          <div className="section-header-row">
            <h3>Transaction History ({activeTab})</h3>
            <MonthYearFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              onReset={() => {
                setSelectedMonth(new Date().getMonth());
                setSelectedYear(new Date().getFullYear());
              }}
            />
          </div>

          <div className="history-content">
            {activeTab === "Upi" ? (
              // Grouped by Provider for UPI
              filteredAccounts.length === 0 ? (
                <div className="text-center p-4">No UPI accounts found.</div>
              ) : (
                filteredAccounts.map((account) => (
                  <div key={account._id} className="provider-history-group">
                    <div className="provider-header">
                      <h4>{account.upiAccountName}</h4>
                    </div>
                    <PaginatedHistoryTable
                      history={account.balanceHistory || []}
                      accountName={account.upiAccountName}
                      filterMonth={selectedMonth}
                      filterYear={selectedYear}
                    />
                  </div>
                ))
              )
            ) : (
              // Aggregated for Cash/Credits
              <div className="history-table-container">
                <PaginatedHistoryTable
                  history={filteredAccounts
                    .flatMap((acc) =>
                      (acc.balanceHistory || []).map((h) => ({
                        ...h,
                        accountName:
                          acc.upiAccountName || `${acc.type} Account`,
                        accountId: acc._id,
                      }))
                    )
                    .sort((a, b) => new Date(b.date) - new Date(a.date))}
                  isAggregated={true}
                  filterMonth={selectedMonth}
                  filterYear={selectedYear}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAccount ? "Edit Account" : "New Account"}</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Account Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={!!editingAccount}
                  className="glass-input"
                >
                  <option value="Upi">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credits">Credits</option>
                </select>
              </div>

              {formData.type === "Upi" && (
                <>
                  <div className="form-group">
                    <label>Provider Name</label>
                    <input
                      type="text"
                      name="upiAccountName"
                      placeholder="GooglePay, PhonePe..."
                      value={formData.upiAccountName}
                      onChange={handleInputChange}
                      className="glass-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Account Number</label>
                    <input
                      type="text"
                      name="upiAccountNumber"
                      placeholder="Enter account number"
                      value={formData.upiAccountNumber}
                      onChange={handleInputChange}
                      className="glass-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      placeholder="e.g., example@okicici"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      className="glass-input"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>
                  {editingAccount ? "Balance (Read Only)" : "Opening Balance"}
                </label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  readOnly={!!editingAccount}
                  className="glass-input"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="glass-input"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-glass">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UniversalDelete
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={confirmDelete}
        title="Delete Account"
        message="This will permanently delete the account and history."
        itemName="Account"
        isLoading={accountsLoading}
      />
    </div>
  );
};

export default BranchAccountDetail;
