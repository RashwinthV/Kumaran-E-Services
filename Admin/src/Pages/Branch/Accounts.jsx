import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../Context/AccountContext";
import "../../Styles/Accounts.css";
import BackButton from "../../Components/BackButton";

const AccountManagement = () => {
  const navigate = useNavigate();
  const { accounts, getAccounts, loading } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    getAccounts();
  }, [getAccounts]);

  // --- Data Processing ---

  // Extract unique branches
  const branches = Array.from(
    new Map(accounts.map((acc) => [acc.branch._id, acc.branch])).values(),
  );

  // Filter branches based on search
  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get unique UPI account names across all branches to create columns
  const upiAccountNames = Array.from(
    new Set(
      accounts
        .filter((acc) => acc.type === "Upi" && acc.upiAccountName)
        .map((acc) => acc.upiAccountName),
    ),
  ).sort();

  const calculateTotalByType = (branchAccounts, type) => {
    return branchAccounts
      .filter((acc) => acc.type === type)
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  };

  const getUpiBalanceByName = (branchAccounts, name) => {
    const acc = branchAccounts.find(
      (a) => a.type === "Upi" && a.upiAccountName === name,
    );
    return acc ? acc.currentBalance || 0 : 0;
  };

  // Safely calculates total for a branch
  const calculateBranchTotal = (branchAccounts) => {
    return branchAccounts.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0,
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Global Stats
  const globalTotal = accounts
    .filter((acc) => acc.type !== "Credits")
    .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

  const globalUpi = accounts
    .filter((a) => a.type === "Upi")
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const globalCash = accounts
    .filter((a) => a.type === "Cash")
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const globalCredit = accounts
    .filter((a) => a.type === "Credits")
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  // --- Handlers ---
  const handleRowClick = (branchId) => {
    navigate(`/branch/${branchId}/accounts`);
  };

  return (
    <div className="account-dashboard">
      <div style={{ marginBottom: "1rem" }}>
        <BackButton />
      </div>
      {/* 1. Global Status Hero */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div>
            <h1 className="hero-title">Financial Overview</h1>
            <p className="hero-subtitle">
              Real-time tracking across {branches.length} branches
            </p>
          </div>
          <div className="hero-total-group">
            <span className="hero-label">Total System Value</span>
            <div className="value-display">
              <span className="currency-symbol">₹</span>
              {new Intl.NumberFormat("en-IN").format(globalTotal)}
            </div>
          </div>
        </div>

        <div className="hero-stats-row">
          <div className="mini-stat">
            <span className="label">Total UPI</span>
            <span className="value text-upi">{formatCurrency(globalUpi)}</span>
          </div>
          <div className="vertical-divider"></div>
          <div className="mini-stat">
            <span className="label">Total Cash</span>
            <span className="value text-cash">
              {formatCurrency(globalCash)}
            </span>
          </div>
          <div className="vertical-divider"></div>
          <div className="mini-stat">
            <span className="label">Total Credit</span>
            <span className="value" style={{ color: "#fd7e14" }}>
              {formatCurrency(globalCredit)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar */}
      <div className="dashboard-controls">
        <div className="search-wrapper">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 3. High-Density List View */}
      <div className="accounts-list-container">
        {/* Table Header */}
        <div
          className="list-header"
          style={{
            gridTemplateColumns: `2fr repeat(${upiAccountNames.length}, 1fr) 1fr 1fr 1.5fr 0.5fr`,
          }}
        >
          <div className="col-branch">Branch</div>
          {upiAccountNames.map((name) => (
            <div key={name} className="col-stat">
              {name}
            </div>
          ))}
          <div className="col-stat">Cash</div>
          <div className="col-stat">Credits</div>
          <div className="col-total">Total Balance</div>
          <div className="col-action"></div>
        </div>

        <div className="list-body">
          {filteredBranches.map((branch) => {
            const branchAccounts = accounts.filter(
              (acc) => acc.branch._id === branch._id,
            );
            const cashBal = calculateTotalByType(branchAccounts, "Cash");
            const creditBal = calculateTotalByType(branchAccounts, "Credits");
            const totalBal = calculateBranchTotal(branchAccounts);

            return (
              <div
                key={branch._id}
                className="list-row"
                style={{
                  gridTemplateColumns: `2fr repeat(${upiAccountNames.length}, 1fr) 1fr 1fr 1.5fr 0.5fr`,
                }}
                onClick={() => handleRowClick(branch._id)}
              >
                <div className="col-branch">
                  <div className="branch-avatar">{branch.name.charAt(0)}</div>
                  <div className="branch-meta">
                    <span className="name">{branch.name}</span>
                    <span className="code">{branch.code}</span>
                  </div>
                </div>

                {upiAccountNames.map((name) => {
                  const bal = getUpiBalanceByName(branchAccounts, name);
                  return (
                    <div key={name} className="col-stat" data-label={name}>
                      <span
                        className={`balance-pill ${
                          bal > 0 ? "pill-upi" : "pill-empty"
                        }`}
                      >
                        {bal > 0 ? formatCurrency(bal) : ""}
                      </span>
                    </div>
                  );
                })}

                <div className="col-stat" data-label="Cash">
                  <span
                    className={`balance-pill ${
                      cashBal > 0 ? "pill-cash" : "pill-empty"
                    }`}
                  >
                    {cashBal > 0 ? formatCurrency(cashBal) : ""}
                  </span>
                </div>

                <div className="col-stat" data-label="Credits">
                  <span
                    className={`balance-pill ${
                      creditBal > 0 ? "pill-credit" : "pill-empty"
                    }`}
                  >
                    {creditBal > 0 ? formatCurrency(creditBal) : ""}
                  </span>
                </div>

                <div className="col-total">
                  <span className="total-text">{formatCurrency(totalBal)}</span>
                </div>

                <div className="col-action">
                  <button className="icon-btn">
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredBranches.length === 0 && (
            <div className="empty-state">
              <i className="bi bi-search"></i>
              <p>No branches found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
