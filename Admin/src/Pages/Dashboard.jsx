import "../Styles/Dashboard.css";
import { useAuth } from "../Context/AuthContext";
import { useBranch } from "../Context/BranchContext";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getCache,
  setCache,
  removeCache,
  CACHE_KEYS,
  TTL,
} from "../utils/cacheUtils";
import { useCustomer } from "../Context/CustomerContext";

const Dashboard = () => {
  const { user, accessToken } = useAuth();
  const { branches, getBranches } = useBranch();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isChartReady, setIsChartReady] = useState(false);
  const { investors, fetchInvestors } =useCustomer();

  useEffect(() => {
    // Small delay to ensure grid layout is finished before rendering Recharts
    const timer = setTimeout(() => setIsChartReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getBranches();
    fetchDashboardStats(selectedBranch);
    fetchInvestors();
  }, [getBranches, selectedBranch]);

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

  const fetchDashboardStats = async (
    branchId = "all",
    forceRefresh = false,
  ) => {
    try {
      if (!accessToken) return;

      const cacheKey = `${CACHE_KEYS.DASHBOARD}_${branchId}`;

      // Check cache
      if (!forceRefresh) {
        const cachedStats = await getCache(cacheKey);
        if (cachedStats) {
          setStats(cachedStats);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;
      const url =
        branchId === "all"
          ? `${baseURL}/dashboard/stats`
          : `${baseURL}/dashboard/stats?branchId=${branchId}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        setStats(response.data.data);
        await setCache(cacheKey, response.data.data, TTL.SHORT);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const trendData = stats?.revenueTrend?.map((item) => ({
    name: item.date.split("-").slice(1).join("/"), // MM/DD
    revenue: item.revenue,
  }));

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0 text-gray-800">Admin Dashboard</h1>
            <p className="text-muted small mb-0">
              {selectedBranch === "all"
                ? "Across all branches"
                : `Viewing stats for ${
                    branches.find((b) => b._id === selectedBranch)?.name
                  }`}
            </p>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm shadow-sm"
              style={{ width: "200px", borderRadius: "8px" }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">All Branches</option>
              {branches?.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm btn-light border shadow-sm"
              style={{ borderRadius: "8px" }}
              onClick={() => fetchDashboardStats(selectedBranch, true)}
              title="Refresh Stats"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Analyzing your business data...</p>
          </div>
        ) : (
          <>
            {/* Top Summary Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <i className="bi bi-people"></i>
                </div>
                <div className="stat-info">
                  <h3>Total Customers</h3>
                  <p className="stat-value">{stats?.totalUsers || 0}</p>
                  <span
                    className={`stat-change ${
                      (stats?.userGrowth || 0) >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {stats?.userGrowth > 0 ? "+" : ""}
                    {stats?.userGrowth?.toFixed(1) || 0}% from last month
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="stat-info">
                  <h3>Total Revenue</h3>
                  <p className="stat-value">
                    {formatCurrency(stats?.totalRevenue)}
                  </p>
                  <span
                    className={`stat-change ${
                      (stats?.revenueGrowth || 0) >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {stats?.revenueGrowth > 0 ? "+" : ""}
                    {stats?.revenueGrowth?.toFixed(1) || 0}% from last month
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <i className="bi bi-receipt"></i>
                </div>
                <div className="stat-info">
                  <h3>Total Bills</h3>
                  <p className="stat-value">{stats?.totalBills || 0}</p>
                  <span
                    className={`stat-change ${
                      (stats?.billsGrowth || 0) >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {stats?.billsGrowth > 0 ? "+" : ""}
                    {stats?.billsGrowth?.toFixed(1) || 0}% from last month
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">
                  <i className="bi bi-shop"></i>
                </div>
                <div className="stat-info">
                  <h3>Today's Sales</h3>
                  <p className="stat-value">
                    {formatCurrency(stats?.todayTotalRevenue)}
                  </p>
                  <span className="stat-change neutral">
                    {stats?.todayTotalBills} bills today
                  </span>
                </div>
              </div>
            </div>

            {/* Unified Secondary Stats Grid (4x2) */}
            <div className="row row-cols-1 row-cols-md-4 g-3 mb-4">
              {/* 1. Total Investors */}
              <div className="col">
                <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Total Investors</p>
                        <h3 className="fw-bold text-primary mb-0">
                          {processedInvestors.length}
                        </h3>
                      </div>
                      <i className="bi bi-people fs-2 text-primary opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>


              {/* 2. Total Branches */}
              <div className="col">
                <div
                  className="card border-0 shadow-sm bg-purple bg-opacity-10 h-100"
                  style={{ backgroundColor: "rgba(111, 66, 193, 0.1)" }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Total Branches</p>
                        <h3
                          className="fw-bold text-purple mb-0"
                          style={{ color: "#6f42c1" }}
                        >
                          {branches?.length || 0}
                        </h3>
                      </div>
                      <i
                        className="bi bi-shop-window fs-2 opacity-25"
                        style={{ color: "#6f42c1" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Total Employees */}
              <div className="col">
                <div className="card border-0 shadow-sm bg-danger bg-opacity-10 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Total Employees</p>
                        <h3 className="fw-bold text-danger mb-0">
                          {stats?.totalEmployees || 0}
                        </h3>
                      </div>
                      <i className="bi bi-person-badge fs-2 text-danger opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Total Products */}
              <div className="col">
                <div
                  className="card border-0 shadow-sm bg-indigo bg-opacity-10 h-100"
                  style={{ backgroundColor: "rgba(102, 16, 242, 0.1)" }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Total Products</p>
                        <h3
                          className="fw-bold text-indigo mb-0"
                          style={{ color: "#6610f2" }}
                        >
                          {stats?.totalProducts || 0}
                        </h3>
                      </div>
                      <i
                        className="bi bi-box-seam fs-2 opacity-25"
                        style={{ color: "#6610f2" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>

                  {/* 5. Total Investment */}
              <div className="col">
                <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">
                          Total Investment
                        </p>
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
                      <i className="bi bi-cash-stack fs-2 text-success opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Pending Interest */}
              <div className="col">
                <div className="card border-0 shadow-sm bg-info bg-opacity-10 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">
                          Pending Interest
                        </p>
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
                      <i className="bi bi-clock-history fs-2 text-info opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Credit Customers */}
              <div className="col">
                <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">
                          Credit Customers
                        </p>
                        <h3 className="fw-bold text-primary mb-0">
                          {stats?.totalCreditCustomers || 0}
                        </h3>
                      </div>
                      <i className="bi bi-people-fill fs-2 text-primary opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. Total Credit Amt */}
              <div className="col">
                <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">
                          Total Credit Amt
                        </p>
                        <h4 className="fw-bold text-warning mb-0">
                          {formatCurrency(stats?.totalCreditAmount)}
                        </h4>
                      </div>
                      <i className="bi bi-currency-rupee fs-2 text-warning opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Stats Row */}
            <div className="row row-cols-1 row-cols-md-4 g-3 mb-4">
              <div className="col">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center">
                    <div
                      className="stat-icon-box rounded-4 p-3 me-3 bg-purple bg-opacity-10"
                      style={{ backgroundColor: "rgba(111, 66, 193, 0.1)" }}
                    >
                      <i
                        className="bi bi-currency-rupee fs-3"
                        style={{ color: "#6f42c1" }}
                      ></i>
                    </div>
                    <div>
                      <p
                        className="text-muted small fw-bold mb-1 text-uppercase"
                        style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
                      >
                        Total Spent
                      </p>
                      <h4 className="fw-bold text-dark mb-0">
                        {formatCurrency(stats?.expenseStats?.total)}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center">
                    <div
                      className="stat-icon-box rounded-4 p-3 me-3 bg-indigo bg-opacity-10"
                      style={{ backgroundColor: "rgba(102, 16, 242, 0.1)" }}
                    >
                      <i
                        className="bi bi-box-seam fs-3"
                        style={{ color: "#6610f2" }}
                      ></i>
                    </div>
                    <div>
                      <p
                        className="text-muted small fw-bold mb-1 text-uppercase"
                        style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
                      >
                        Product Cost
                      </p>
                      <h4 className="fw-bold text-dark mb-0">
                        {formatCurrency(stats?.expenseStats?.product)}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="stat-icon-box rounded-4 p-3 me-3 bg-success bg-opacity-10">
                      <i className="bi bi-people fs-3 text-success"></i>
                    </div>
                    <div>
                      <p
                        className="text-muted small fw-bold mb-1 text-uppercase"
                        style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
                      >
                        Employee Pay
                      </p>
                      <h4 className="fw-bold text-dark mb-0">
                        {formatCurrency(stats?.expenseStats?.employee)}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="stat-icon-box rounded-4 p-3 me-3 bg-danger bg-opacity-10">
                      <i className="bi bi-building fs-3 text-danger"></i>
                    </div>
                    <div>
                      <p
                        className="text-muted small fw-bold mb-1 text-uppercase"
                        style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
                      >
                        Operational
                      </p>
                      <h4 className="fw-bold text-dark mb-0">
                        {formatCurrency(stats?.expenseStats?.operational)}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-main-grid">
              {/* Today's Performance Section */}
              <div className="dashboard-card performance-card">
                <div className="card-header">
                  <h2>Today's Performance</h2>
                </div>
                <div className="performance-split-container">
                  <div className="revenue-table-container">
                    <table className="revenue-table">
                      <thead>
                        <tr>
                          <th>Branch</th>
                          <th>Revenue</th>
                          <th>Bills</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.branchStats?.length > 0 ? (
                          stats.branchStats.map((branch) => (
                            <tr key={branch.id}>
                              <td>
                                <Link
                                  to={`/branch/${branch.id}/report`}
                                  state={{ dateRange: "today" }}
                                  className="text-decoration-none fw-semibold"
                                >
                                  {branch.name}
                                </Link>
                              </td>
                              <td className="revenue-amount">
                                {formatCurrency(branch.revenue)}
                              </td>
                              <td>{branch.bills}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">
                              No transactions yet today
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="payment-split-section">
                    <h6>Payment Mode Split (Today)</h6>
                    <div className="payment-progress-bar">
                      <div
                        className="progress-segment cash"
                        style={{
                          width: `${
                            (stats?.paymentSplit?.Cash /
                              (stats?.todayTotalRevenue || 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="progress-segment online"
                        style={{
                          width: `${
                            (stats?.paymentSplit?.Online /
                              (stats?.todayTotalRevenue || 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="payment-legend">
                      <div className="legend-item">
                        <span className="dot cash"></span> Cash{" "}
                        {formatCurrency(stats?.paymentSplit?.Cash)}
                      </div>
                      <div className="legend-item">
                        <span className="dot online"></span> Online{" "}
                        {formatCurrency(stats?.paymentSplit?.Online)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Trend Chart */}
              <div className="dashboard-card chart-card">
                <div className="card-header">
                  <h2>Revenue Trend (Last 7 Days)</h2>
                </div>
                <div className="chart-container">
                  {isChartReady && trendData && trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trendData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRev"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          width={60}
                          tickFormatter={(value) =>
                            `₹${
                              value >= 1000
                                ? (value / 1000).toFixed(1) + "k"
                                : value
                            }`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                          formatter={(value) => [
                            formatCurrency(value),
                            "Revenue",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                          animationDuration={1500}
                          activeDot={{
                            r: 6,
                            style: {
                              fill: "#6366f1",
                              stroke: "#fff",
                              strokeWidth: 2,
                            },
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                      No trend data available for this week
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>Recent Sales</h2>
                  <Link to="/report" className="view-all-button">
                    All
                  </Link>
                </div>
                <div className="transaction-list">
                  {stats?.recentTransactions?.length > 0 ? (
                    stats.recentTransactions.map((tx, idx) => (
                      <div key={idx} className="transaction-item">
                        <div className="tx-details">
                          <p className="tx-bill">{tx.billNumber}</p>
                          <p className="tx-branch">{tx.branch}</p>
                        </div>
                        <div className="tx-stats">
                          <p className="tx-amount">
                            {formatCurrency(tx.amount)}
                          </p>
                          <p className="tx-customer">{tx.customer}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-3">
                      No recent sales
                    </p>
                  )}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="d-flex align-items-center gap-2">
                    <h2>Inventory Alerts</h2>
                    <span className="badge bg-danger rounded-pill">
                      {stats?.lowStockCount || 0}
                    </span>
                  </div>
                  {selectedBranch !== "all" && (
                    <Link
                      to={`/branch/${selectedBranch}/products`}
                      className="view-all-button mb-2"
                    >
                      View All
                    </Link>
                  )}
                </div>
                <div className="low-stock-list">
                  {stats?.lowStockItems?.length > 0 ? (
                    stats.lowStockItems.map((item, idx) => (
                      <Link
                        key={idx}
                        to={`/branch/${item.branchId}/products`}
                        className="low-stock-item text-decoration-none"
                        style={{ color: "inherit" }}
                      >
                        <div className="item-info">
                          <p className="item-name">{item.name}</p>
                          <p className="item-branch">{item.branch}</p>
                        </div>
                        <div className="item-qty">
                          <span className="qty-value text-danger">
                            {item.qty}
                          </span>
                          <span className="qty-label">pcs</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-muted text-center py-3">All clear!</p>
                  )}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>Top Products (Month)</h2>
                </div>
                <div className="top-products-list">
                  {stats?.topProducts?.length > 0 ? (
                    stats.topProducts.map((item, idx) => (
                      <div key={idx} className="product-rank-item">
                        <div className="product-info">
                          <p className="product-name">{item.name}</p>
                          <p className="product-sales">{item.qty} units sold</p>
                        </div>
                        <div className="product-revenue">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-3">
                      No sales data yet
                    </p>
                  )}
                </div>
              </div>

              {/* Top Performing Staff */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>Staff Rankings</h2>
                </div>
                <div className="staff-leaderboard">
                  {stats?.topStaff?.length > 0 ? (
                    stats.topStaff.map((staff, idx) => (
                      <div key={idx} className="staff-item">
                        <div className="staff-rank">{idx + 1}</div>
                        <div className="staff-info">
                          <p className="staff-name">{staff.name}</p>
                          <p className="staff-bills">{staff.bills} bills</p>
                        </div>
                        <div className="staff-revenue">
                          {formatCurrency(staff.revenue)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-3">
                      No active staff this month
                    </p>
                  )}
                </div>
              </div>

              {/* branch Shortcuts (Premium Square Grid) */}
              <div className="dashboard-card quick-actions-card">
                <div className="card-header">
                  <h2>Branch Shortcuts</h2>
                </div>
                {branches?.length > 0 ? (
                  branches.map((branch) => (
                    <div key={branch._id} className="branch-group mb-4">
                      <h6 className="text-muted small fw-bold text-uppercase mb-3">
                        {branch.name.toUpperCase()}
                      </h6>
                      <div className="quick-actions-grid branch-actions-grid">
                        <Link
                          to={`/branch/${branch._id}/products`}
                          className="qa-item"
                          title="Inventory & Products"
                        >
                          <div className="qa-icon bg-soft-blue">
                            <i className="bi bi-box"></i>
                          </div>
                          <span>Products</span>
                        </Link>
                        <Link
                          to={`/branch/${branch._id}/employee`}
                          className="qa-item"
                          title="Staff Management"
                        >
                          <div className="qa-icon bg-soft-green">
                            <i className="bi bi-people"></i>
                          </div>
                          <span>Employees</span>
                        </Link>
                        <Link
                          to={`/branch/${branch._id}/accounts`}
                          className="qa-item"
                          title="Account & Billing"
                        >
                          <div className="qa-icon bg-soft-purple">
                            <i className="bi bi-bank2"></i>
                          </div>
                          <span>Accounts</span>
                        </Link>
                        <Link
                          to={`/branch/${branch._id}/report`}
                          className="qa-item"
                          title="Sales Reports"
                        >
                          <div className="qa-icon bg-soft-orange">
                            <i className="bi bi-graph-up-arrow"></i>
                          </div>
                          <span>Reports</span>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small text-center w-100 py-3">
                    No active branches
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
