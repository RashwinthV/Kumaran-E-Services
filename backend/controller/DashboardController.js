const mongoose = require("mongoose");
const Branch = require("../models/Branch");
const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
// const Account = require("../models/Accounts");
const Inventory = require("../models/Inventory");
// const User = require("../models/user");

// Helper to get date string YYYY-MM-DD
const formatDate = (date) => date.toISOString().slice(0, 10);

// Helper to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

// @desc    Get dashboard statistics
// @route   GET /admin/dashboard/stats
// @access  Private (Admin/Manager)
exports.getDashboardStats = async (req, res) => {
  try {
    let { branchId } = req.query;

    // Aggregations require ObjectId, not strings
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      branchId = new mongoose.Types.ObjectId(branchId);
    } else {
      branchId = null;
    }
    const today = new Date();
    const dateKey = formatDate(today);

    // --- Date Ranges ---
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const thisMonthStartStr = formatDate(startOfThisMonth);
    const lastMonthStartStr = formatDate(startOfLastMonth);
    const lastMonthEndStr = formatDate(endOfLastMonth);

    // Base queries
    const customerFilter = branchId ? { branch: branchId } : {};
    const saleFilter = branchId ? { branch: branchId } : {};

    // 1. Core Counts & Growth
    const totalUsers = await Customer.countDocuments(customerFilter);
    const newUsersThisMonth = await Customer.countDocuments({
      ...customerFilter,
      createdAt: { $gte: startOfThisMonth },
    });
    const newUsersLastMonth = await Customer.countDocuments({
      ...customerFilter,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const userGrowth = calculatePercentageChange(
      newUsersThisMonth,
      newUsersLastMonth
    );

    // 2. Revenue & Bills (Aggregated)
    const statsResult = await Sale.aggregate([
      {
        $facet: {
          thisMonth: [
            {
              $match: {
                ...saleFilter,
                date: { $gte: thisMonthStartStr },
              },
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$dayGrandTotal" },
                bills: {
                  $sum: {
                    $cond: [{ $isArray: "$sales" }, { $size: "$sales" }, 0],
                  },
                },
              },
            },
          ],
          lastMonth: [
            {
              $match: {
                ...saleFilter,
                date: { $gte: lastMonthStartStr, $lte: lastMonthEndStr },
              },
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$dayGrandTotal" },
                bills: {
                  $sum: {
                    $cond: [{ $isArray: "$sales" }, { $size: "$sales" }, 0],
                  },
                },
              },
            },
          ],
          allTime: [
            { $match: { ...saleFilter } },
            {
              $group: {
                _id: null,
                total: { $sum: "$dayGrandTotal" },
                totalBills: {
                  $sum: {
                    $cond: [{ $isArray: "$sales" }, { $size: "$sales" }, 0],
                  },
                },
              },
            },
          ],
          trend: [
            { $match: { ...saleFilter } },
            { $sort: { date: -1 } },
            { $limit: 7 },
            { $project: { date: 1, revenue: "$dayGrandTotal" } },
          ],
        },
      },
    ]);

    const stats = statsResult[0] || {};
    const revenueThisMonth = stats.thisMonth?.[0]?.revenue || 0;
    const billsThisMonth = stats.thisMonth?.[0]?.bills || 0;
    const revenueLastMonth = stats.lastMonth?.[0]?.revenue || 0;
    const billsLastMonth = stats.lastMonth?.[0]?.bills || 0;
    const totalRevenue = stats.allTime?.[0]?.total || 0;
    const totalBills = stats.allTime?.[0]?.totalBills || 0;
    const revenueTrend = (stats.trend || []).reverse();

    const revenueGrowth = calculatePercentageChange(
      revenueThisMonth,
      revenueLastMonth
    );
    const billsGrowth = calculatePercentageChange(
      billsThisMonth,
      billsLastMonth
    );

    // 3. Today's Branch Stats & Payment Split
    const branches = await Branch.find({ status: "Active" }).select(
      "name code status"
    );
    const todaysSalesFilter = branchId
      ? { date: dateKey, branch: branchId }
      : { date: dateKey };
    const todaysSales = await Sale.find(todaysSalesFilter)
      .populate("branch", "code name")
      .populate({ path: "sales.paymentMethod", select: "type" });

    let paymentSplit = { Cash: 0, Online: 0 };
    const branchStats = branches.map((branch) => {
      const branchSale = todaysSales.find(
        (s) =>
          (s.branch && s.branch.code === branch.code) ||
          (s.branch && String(s.branch._id) === String(branch._id))
      );
      return {
        id: branch._id,
        name: branch.name,
        code: branch.code,
        revenue: branchSale ? branchSale.dayGrandTotal : 0,
        bills: branchSale
          ? Array.isArray(branchSale.sales)
            ? branchSale.sales.length
            : 0
          : 0,
        status: branch.status,
      };
    });

    todaysSales.forEach((dayRecord) => {
      if (Array.isArray(dayRecord.sales)) {
        dayRecord.sales.forEach((s) => {
          const amount =
            (Number(s.grandTotal) || 0) - (Number(s.totalRefundedAmount) || 0);
          if (s.paymentMethod?.type === "Cash") {
            paymentSplit.Cash += amount;
          } else {
            paymentSplit.Online += amount;
          }
        });
      }
    });

    // 4. Top Products (Monthly)
    const productStats = await Sale.aggregate([
      {
        $match: {
          ...saleFilter,
          date: { $gte: thisMonthStartStr },
        },
      },
      { $unwind: { path: "$sales", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$sales.items", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: "$sales.items.product",
          totalQty: {
            $sum: {
              $subtract: [
                "$sales.items.qty",
                { $ifNull: ["$sales.items.refundedQty", 0] },
              ],
            },
          },
          revenue: {
            $sum: {
              $subtract: [
                "$sales.items.lineTotal",
                {
                  $cond: [
                    { $gt: ["$sales.items.qty", 0] },
                    {
                      $multiply: [
                        {
                          $divide: [
                            "$sales.items.lineTotal",
                            "$sales.items.qty",
                          ],
                        },
                        { $ifNull: ["$sales.items.refundedQty", 0] },
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
    ]);

    const topProducts = productStats.map((p) => ({
      name: p.productInfo?.[0]?.name || "Unknown Product",
      qty: p.totalQty || 0,
      revenue: p.revenue || 0,
    }));

    // 5. Low Stock - Exclude Service Categories
    const serviceCategories = [
      "Other",
      "Services",
      "Xerox",
      "Scan",
      "Scanning",
      "Photography",
      "Photograph",
      "Internet",
    ];

    const lowStockItems = await Inventory.aggregate([
      {
        $match: branchId
          ? {
              branch: branchId,
              $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
            }
          : { $expr: { $lte: ["$quantity", "$lowStockThreshold"] } },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $match: {
          "categoryInfo.name": { $nin: serviceCategories },
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchInfo",
        },
      },
      { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          quantity: 1,
          lowStockThreshold: 1,
          product: {
            name: "$productInfo.name",
          },
          branch: {
            name: "$branchInfo.name",
            _id: "$branchInfo._id",
          },
        },
      },
    ]);

    // 6. Recent Transactions
    const recentSalesRecords = await Sale.find({ ...saleFilter })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("sales.customer", "name")
      .populate("branch", "name");

    const recentTransactions = [];
    recentSalesRecords.forEach((dayRecord) => {
      if (Array.isArray(dayRecord.sales)) {
        dayRecord.sales.slice(-5).forEach((s) => {
          recentTransactions.push({
            billNumber: s.billNumber || "N/A",
            customer: s.customer?.name || "Walk-in",
            amount: (s.grandTotal || 0) - (s.totalRefundedAmount || 0),
            branch: dayRecord.branch?.name || "Unknown",
            time: s.createdAt,
          });
        });
      }
    });
    recentTransactions.sort((a, b) => new Date(b.time) - new Date(a.time));

    // 7. Top Staff (Monthly)
    const staffStats = await Sale.aggregate([
      {
        $match: {
          ...saleFilter,
          date: { $gte: thisMonthStartStr },
        },
      },
      { $unwind: { path: "$sales", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: "$sales.staff",
          totalSales: {
            $sum: {
              $subtract: [
                { $ifNull: ["$sales.grandTotal", 0] },
                { $ifNull: ["$sales.totalRefundedAmount", 0] },
              ],
            },
          },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staffInfo",
        },
      },
    ]);

    const topStaff = staffStats.map((s) => ({
      name: s.staffInfo?.[0]?.name || "Unknown",
      revenue: s.totalSales || 0,
      bills: s.billCount || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        userGrowth,
        totalRevenue,
        revenueGrowth,
        totalBills,
        billsGrowth,
        todayTotalRevenue: branchStats.reduce((sum, b) => sum + b.revenue, 0),
        todayTotalBills: branchStats.reduce((sum, b) => sum + b.bills, 0),
        branchStats,
        revenueTrend,
        paymentSplit,
        topProducts,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((i) => ({
          inventoryId: i._id?.toString(),
          name: i.product?.name,
          branch: i.branch?.name,
          branchId: i.branch?._id?.toString(),
          qty: i.quantity,
          threshold: i.lowStockThreshold,
        })),
        recentTransactions: recentTransactions.slice(0, 5),
        topStaff,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard statistics",
    });
  }
};
