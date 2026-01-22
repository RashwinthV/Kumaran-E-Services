const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Account = require("../models/Account");
const Branch = require("../models/Branch");
const { ensureDailySession } = require("./AccountController");

// @desc    Create new expense
// @route   POST /api/staff/expenses
// @access  Private (Staff/Admin/Manager)
exports.createExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      category,
      description,
      amount,
      paymentAccount,
      date,
      metadata,
      notes,
    } = req.body;

    // 0. Salary Validation Check
    if (category === "Employee" && metadata.employeePaymentType === "salary") {
      const { employeeName, salaryFromDate, salaryToDate } = metadata;
      const start = new Date(salaryFromDate);
      const end = new Date(salaryToDate);

      const overlappingExpense = await Expense.findOne({
        category: "Employee",
        "metadata.employeeName": employeeName,
        "metadata.employeePaymentType": "salary",
        $or: [
          {
            "metadata.salaryFromDate": { $lte: end },
            "metadata.salaryToDate": { $gte: start },
          },
        ],
      });

      if (overlappingExpense) {
        throw new Error(
          `Salary for ${employeeName} has already been recorded for a period overlapping ${new Date(salaryFromDate).toLocaleDateString()} to ${new Date(salaryToDate).toLocaleDateString()}.`,
        );
      }
    }

    // 1. Resolve Branch
    const branch = await Branch.findOne({ code: req.user.branchCode }).session(
      session,
    );
    if (!branch) {
      throw new Error("Branch not found for the user");
    }

    // 2. Fetch & Validate Account
    const account = await Account.findById(paymentAccount).session(session);
    if (!account) {
      throw new Error("Payment account not found");
    }

    // 3. Ensure Daily Session and update balance
    const sessionDetail = await ensureDailySession(paymentAccount, session);
    if (!sessionDetail) {
      throw new Error("Failed to resolve account session");
    }

    const { account: updatedAccount, dailySession } = sessionDetail;

    if (dailySession.isClosed) {
      throw new Error(
        "This account is closed for today. Please re-open or use another account.",
      );
    }

    // Deduct from balances
    updatedAccount.currentBalance -= amount;
    dailySession.expectedClosingBalance -= amount;

    await updatedAccount.save({ session });

    // 4. Create Expense Document
    const expense = await Expense.create(
      [
        {
          branch: branch._id,
          recordedBy: req.user.id,
          category,
          description,
          amount,
          paymentAccount,
          date: date || new Date(),
          metadata,
          notes,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      data: expense[0],
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Create expense error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating expense",
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get all expenses for a branch
// @route   GET /api/staff/expenses
// @access  Private (Staff/Admin/Manager)
exports.getExpenses = async (req, res) => {
  try {
    const branch = await Branch.findOne({ code: req.user.branchCode });
    if (!branch && req.user.role !== "admin") {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const query = req.user.role === "admin" ? {} : { branch: branch._id };

    const expenses = await Expense.find(query)
      .populate("paymentAccount", "name type")
      .populate("recordedBy", "name")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching expenses",
      error: error.message,
    });
  }
};

// @desc    Get employee advance/salary summary
// @route   GET /api/staff/expenses/employee/:name/summary
// @access  Private
exports.getEmployeeExpenseSummary = async (req, res) => {
  try {
    const { name } = req.params;
    const branch = await Branch.findOne({ code: req.user.branchCode });

    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    const expenses = await Expense.find({
      branch: branch._id,
      category: "Employee",
      "metadata.employeeName": name,
    });

    let totalAdvance = 0;
    let totalDeductions = 0;
    const salaryHistory = [];

    expenses.forEach((exp) => {
      if (exp.metadata.employeePaymentType === "advance") {
        totalAdvance += exp.amount;
      } else if (exp.metadata.employeePaymentType === "salary") {
        totalDeductions += exp.metadata.deductions || 0;
        salaryHistory.push({
          from: exp.metadata.salaryFromDate,
          to: exp.metadata.salaryToDate,
          amount: exp.amount,
          date: exp.date,
        });
      }
    });

    const pendingAdvance = totalAdvance - totalDeductions;

    res.status(200).json({
      success: true,
      data: {
        totalAdvance,
        totalDeductions,
        pendingAdvance: pendingAdvance > 0 ? pendingAdvance : 0,
        salaryHistory,
      },
    });
  } catch (error) {
    console.error("Get employee summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching employee summary",
    });
  }
};
