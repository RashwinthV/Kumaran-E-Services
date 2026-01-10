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

const Dashboard = () => {
  const { user, accessToken } = useAuth();
  const { branches, getBranches } = useBranch();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure grid layout is finished before rendering Recharts
    const timer = setTimeout(() => setIsChartReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getBranches();
    fetchDashboardStats(selectedBranch);
  }, [getBranches, selectedBranch]);

  const fetchDashboardStats = async (
    branchId = "all",
    forceRefresh = false
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
