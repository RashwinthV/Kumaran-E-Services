import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-toastify";

const AccountsSettings = () => {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [closingBalance, setClosingBalance] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!closingBalance || isNaN(closingBalance)) {
      return toast.error("Please enter a valid closing balance");
    }

    try {
      const res = await axios.post(
        API_ENDPOINTS.CLOSE_ACCOUNT(selectedAccount._id),
        { closingBalance: parseFloat(closingBalance) },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data.success) {
        toast.success(`${selectedAccount.type} account closed successfully`);
        setShowCloseModal(false);
        setClosingBalance("");
        setSelectedAccount(null);
        fetchAccounts();
      }
    } catch (error) {
      console.error("Close account error:", error);
      toast.error(error.response?.data?.message || "Failed to close account");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case "Cash":
        return "bi-cash-stack";
      case "Upi":
        return "bi-qr-code";
      case "Credits":
        return "bi-credit-card";
      default:
        return "bi-wallet2";
    }
  };

  const handleCheckboxChange = (e) => {
    if (e.target.checked && selectedAccount?.currentBalance != null) {
      setClosingBalance(selectedAccount.currentBalance);
    } else {
      setClosingBalance("");
    }
  };

  const handleCancel=()=>{
    setShowCloseModal(false);
    setClosingBalance("");
    setSelectedAccount(null);
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-settings">
      <div className="mb-4">
        <h3 className="fw-bold mb-2">Account Management</h3>
        <p className="text-muted small">
          Manage daily sessions and close accounts at the end of your shift
        </p>
      </div>

      <div className="row g-3">
        {accounts.map((account) => (
          <div key={account._id} className="col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "48px",
                      height: "48px",
                      background:
                        account.type === "Cash"
                          ? "linear-gradient(135deg, #059669, #047857)"
                          : account.type === "Upi"
                          ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                          : "linear-gradient(135deg, #ea580c, #c2410c)",
                    }}
                  >
                    <i
                      className={`bi ${getAccountIcon(
                        account.type
                      )} text-white fs-5`}
                    ></i>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-bold">
                      {account.type === "Upi"
                        ? account.upiAccountName
                        : `${account.type} Account`}
                    </h6>
                    <div className="d-flex gap-2">
                      <span
                        className={`badge ${
                          account.status === "Active"
                            ? "bg-success-subtle text-success"
                            : "bg-secondary-subtle text-secondary"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {account.status}
                      </span>
                      <span
                        className={`badge ${
                          account.currentStatus === "Closed"
                            ? "bg-danger-subtle text-danger"
                            : "bg-success-subtle text-success"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {account.currentStatus || "Open"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-light rounded p-3 mb-3 text-center">
                  <small className="text-muted d-block mb-1">
                    Current Balance
                  </small>
                  <h4 className="mb-0 fw-bold text-primary">
                    {formatCurrency(account.currentBalance || 0)}
                  </h4>
                </div>

                {account.currentStatus !== "Closed" && (
                  <button
                    className="btn btn-outline-danger w-100 btn-sm"
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowCloseModal(true);
                    }}
                  >
                    <i className="bi bi-lock-fill me-2"></i>
                    Close Daily Session
                  </button>
                )}

                {account.currentStatus === "Closed" && (
                  <div className="alert alert-info mb-0 py-2 small">
                    <i className="bi bi-info-circle me-2"></i>
                    Session closed for today
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-5">
          <i className="fa-solid fa-vault fs-1 text-muted d-block mb-3"></i>
          <p className="text-muted">No accounts found for your branch</p>
        </div>
      )}

      {/* Close Account Modal */}
      {showCloseModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 2000,
            // background: "rgba(0,0,0,0.5)",
            // backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowCloseModal(false)}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{ width: "100%", maxWidth: "450px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold">
                Close {selectedAccount?.type} Session
              </h5>
              <button
                className="btn-close"
                onClick={() => setShowCloseModal(false)}
              ></button>
            </div>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Enter the actual physical balance available in the{" "}
              {selectedAccount?.type} account to close it for the day.
            </p>

            <div className="mb-4 p-3 bg-light rounded-3">
              <label
                className="text-muted mb-1"
                style={{ fontSize: "0.75rem", fontWeight: 600 }}
              >
                EXPECTED BALANCE
              </label>
              <div className="fs-3 fw-bold text-primary">
                {formatCurrency(selectedAccount?.currentBalance || 0)}
              </div>
            </div>

            <div className="mb-4">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: "0.85rem" }}
              >
                Actual Physical Balance
              </label>
           <div className="d-flex align-items-center gap-2 mt-2 mb-3">
  <input
    type="checkbox"
    checked={Boolean(closingBalance)}
    className="form-check-input border border-1 border-dark"
    onChange={handleCheckboxChange}
    id="sameBalance"
  />
  <label
    htmlFor="sameBalance"
    className="text-muted fst-italic mb-0 cursor-pointer"
  >
    Same as Expected Balance
  </label>
</div>


              <div className="input-group input-group-lg">
                <span className="input-group-text bg-white">₹
                <input
                  type="number"
                  className="form-control form-control-lg border-0"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  style={{ fontSize: "1.25rem", fontWeight: 600 }}
                /></span>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-lg btn-light flex-fill"
                onClick={handleCancel}
                style={{ fontWeight: 600 }}
              >
                CANCEL
              </button>
              <button
                className="btn btn-lg btn-primary flex-fill"
                onClick={handleCloseSession}
                style={{ fontWeight: 600 }}
              >
                CONFIRM & CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsSettings;
