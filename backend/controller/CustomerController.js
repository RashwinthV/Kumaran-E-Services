const Customer = require("../models/Customer");
const Branch = require("../models/Branch");
const Account = require("../models/Account");
const Sale = require("../models/Sale");
const mongoose = require("mongoose");
const { ensureDailySession } = require("./AccountController");

// @desc    Get all customers for a branch
// @route   GET /api/customers/my-branch
// @access  Private (Staff/Admin)
exports.getMyBranchCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      branchCode: req.user.branchCode,
    })
      .populate("credits.products", "name code")
      .sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create/Update customer
// @route   POST /api/customers
// @access  Private (Staff/Admin)
exports.upsertCustomer = async (req, res) => {
  try {
    const { name, phone, city } = req.body;

    // Find branch
    const branch = await Branch.findOne({ code: req.user.branchCode });
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    // Try to find by phone within the same branch
    let customer = await Customer.findOne({
      phone,
      branchCode: req.user.branchCode,
    });

    if (customer) {
      customer.name = name;
      customer.city = city;
      await customer.save();
    } else {
      customer = await Customer.create({
        name,
        phone,
        city,
        branch: branch._id,
        branchCode: req.user.branchCode,
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search customers by phone
// @route   GET /api/customers/search/:phone
// @access  Private
exports.searchByPhone = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      phone: req.params.phone,
      branchCode: req.user.branchCode,
    });

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Settle customer credit
// @route   POST /api/customers/:customerId/settle-credit
// @access  Private (Staff/Admin)
exports.settleCustomerCredit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId } = req.params;
    const { amount, paymentMethod, creditItemIds, notes, itemSettlements } =
      req.body;

    if (!paymentMethod) {
      throw new Error("Payment method is required");
    }

    // 1. Get Customer
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const totalOutstanding = customer.credits.reduce(
      (sum, c) => sum + c.totalAmount,
      0
    );

    // Calculate total settlement amount
    let settlementAmount = 0;
    if (itemSettlements && itemSettlements.length > 0) {
      settlementAmount = itemSettlements.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0
      );
    } else if (creditItemIds && creditItemIds.length > 0) {
      const itemsToSettle = customer.credits.filter((c) =>
        creditItemIds.includes(c._id.toString())
      );
      settlementAmount = itemsToSettle.reduce(
        (sum, c) => sum + c.totalAmount,
        0
      );
    } else {
      settlementAmount = parseFloat(amount);
    }

    if (isNaN(settlementAmount) || settlementAmount <= 0) {
      throw new Error("Invalid settlement amount");
    }

    if (settlementAmount > totalOutstanding + 0.01) {
      throw new Error(
        `Settlement amount (₹${settlementAmount}) exceeds total outstanding (₹${totalOutstanding})`
      );
    }

    // 2. Resolve Accounts
    const destAccount = await Account.findById(paymentMethod).session(session);
    if (!destAccount) {
      throw new Error("Destination account not found");
    }

    const creditsAccount = await Account.findOne({
      branch: customer.branch,
      type: "Credits",
    }).session(session);
    if (!creditsAccount) {
      throw new Error("Credits account not found for this branch");
    }

    // 3. Update Balances & Daily Sessions
    const destSessionData = await ensureDailySession(paymentMethod, session);
    const creditsSessionData = await ensureDailySession(
      creditsAccount._id,
      session
    );

    if (!destSessionData || !creditsSessionData) {
      throw new Error("Failed to resolve account sessions");
    }

    const { account: updatedDestAccount, dailySession: destDailySession } =
      destSessionData;
    const {
      account: updatedCreditsAccount,
      dailySession: creditsDailySession,
    } = creditsSessionData;

    if (destDailySession.isClosed) {
      throw new Error("Destination account is closed for today");
    }
    if (creditsDailySession.isClosed) {
      throw new Error("Credits account is closed for today");
    }

    // Update Balances
    updatedDestAccount.currentBalance += settlementAmount;
    destDailySession.expectedClosingBalance += settlementAmount;
    await updatedDestAccount.save({ session });

    updatedCreditsAccount.currentBalance -= settlementAmount;
    creditsDailySession.expectedClosingBalance -= settlementAmount;
    await updatedCreditsAccount.save({ session });

    // 4. Update Customer Credits Array & Billing Status
    const saleRecordsToUpdate = new Map();

    if (itemSettlements && itemSettlements.length > 0) {
      // Process specific settlements per bill
      for (const item of itemSettlements) {
        const creditItem = customer.credits.find(
          (c) => c._id.toString() === item.id
        );
        if (!creditItem) continue;

        const settleAmt = parseFloat(item.amount);
        if (settleAmt <= 0) continue;

        const amountBefore = creditItem.totalAmount;
        creditItem.totalAmount -= settleAmt;
        const amountAfter = Math.max(0, creditItem.totalAmount);

        // Initialize originalAmount if not set
        if (!creditItem.originalAmount) {
          creditItem.originalAmount = amountBefore;
        }

        // Initialize paymentHistory array if not exists
        if (!creditItem.paymentHistory) {
          creditItem.paymentHistory = [];
        }

        // Get payment method name
        let paymentMethodName = "Unknown";
        if (destAccount.type === "Upi" && destAccount.upiAccountName) {
          paymentMethodName = destAccount.upiAccountName;
        } else {
          paymentMethodName = destAccount.type;
        }

        // Record payment history
        creditItem.paymentHistory.push({
          date: new Date(),
          amount: settleAmt,
          paymentMethod: paymentMethod,
          paymentMethodName: paymentMethodName,
          creditItem: creditItem._id,
          billNumber: creditItem.billNumber,
          amountBefore: amountBefore,
          amountAfter: amountAfter,
          notes: notes || `Partial payment of ₹${settleAmt}`,
          recordedBy: req.user._id,
        });

        // 4. Update Sale History with partial/full payment
        if (creditItem.sale && creditItem.billNumber) {
          let saleRecord = saleRecordsToUpdate.get(creditItem.sale.toString());
          if (!saleRecord) {
            saleRecord = await Sale.findById(creditItem.sale).session(session);
            if (saleRecord)
              saleRecordsToUpdate.set(creditItem.sale.toString(), saleRecord);
          }

          if (saleRecord) {
            // Find sale by bill number (trim and case-insensitive for robustness)
            const targetBill = (creditItem.billNumber || "").trim();
            const individualSale = saleRecord.sales.find(
              (s) => (s.billNumber || "").trim() === targetBill
            );

            // Update if found, regardless of status (though usually it's Pending)
            if (individualSale) {
              // Calculate proportional subtotal and tax for this partial payment
              const taxRatio =
                (individualSale.totalTax || 0) /
                (individualSale.grandTotal || 1);
              const taxPart = settleAmt * taxRatio;
              const subtotalPart = settleAmt - taxPart;

              // Save the update even if status is already completed (for robustness)
              const alreadyPaid = individualSale.status === "Completed";

              if (!alreadyPaid) {
                // Update Sale History Totals (Real-time realization of revenue)
                // Only if not already counted (to prevent double counting)
                saleRecord.daySubtotal += subtotalPart;
                saleRecord.dayTotalTax += taxPart;
                saleRecord.dayGrandTotal += settleAmt;
              }

              // Update individual sale tracking
              individualSale.paidAmount =
                (individualSale.paidAmount || 0) + settleAmt;

              // If fully settled, mark as Completed
              if (creditItem.totalAmount <= 0.01) {
                creditItem.totalAmount = 0;
                individualSale.status = "Completed";
              }

              saleRecord.markModified("sales");
            }
          }
        }
      }
    } else {
      // FIFO or selected IDs logic (existing behavior)
      let remainingToSettle = settlementAmount;
      let creditItemsToProcess = [];
      if (creditItemIds && creditItemIds.length > 0) {
        creditItemsToProcess = customer.credits.filter((c) =>
          creditItemIds.includes(c._id.toString())
        );
      } else {
        customer.credits.sort((a, b) => new Date(a.date) - new Date(b.date));
        creditItemsToProcess = customer.credits;
      }

      for (
        let i = 0;
        i < creditItemsToProcess.length && remainingToSettle > 0;
        i++
      ) {
        const creditItem = creditItemsToProcess[i];
        const settlementFromThisItem = Math.min(
          creditItem.totalAmount,
          remainingToSettle
        );

        const amountBefore = creditItem.totalAmount;
        creditItem.totalAmount -= settlementFromThisItem;
        const amountAfter = Math.max(0, creditItem.totalAmount);
        remainingToSettle -= settlementFromThisItem;

        // Initialize originalAmount if not set
        if (!creditItem.originalAmount) {
          creditItem.originalAmount = amountBefore;
        }

        // Initialize paymentHistory array if not exists
        if (!creditItem.paymentHistory) {
          creditItem.paymentHistory = [];
        }

        // Get payment method name
        let paymentMethodName = "Unknown";
        if (destAccount.type === "Upi" && destAccount.upiAccountName) {
          paymentMethodName = destAccount.upiAccountName;
        } else {
          paymentMethodName = destAccount.type;
        }

        // Record payment history
        creditItem.paymentHistory.push({
          date: new Date(),
          amount: settlementFromThisItem,
          paymentMethod: paymentMethod,
          paymentMethodName: paymentMethodName,
          creditItem: creditItem._id,
          billNumber: creditItem.billNumber,
          amountBefore: amountBefore,
          amountAfter: amountAfter,
          notes: notes || `Payment of ₹${settlementFromThisItem}`,
          recordedBy: req.user._id,
        });

        // Update Sale History with partial/full payment
        if (creditItem.sale && creditItem.billNumber) {
          let saleRecord = saleRecordsToUpdate.get(creditItem.sale.toString());
          if (!saleRecord) {
            saleRecord = await Sale.findById(creditItem.sale).session(session);
            if (saleRecord)
              saleRecordsToUpdate.set(creditItem.sale.toString(), saleRecord);
          }

          if (saleRecord) {
            const targetBill = (creditItem.billNumber || "").trim();
            const individualSale = saleRecord.sales.find(
              (s) => (s.billNumber || "").trim() === targetBill
            );

            if (individualSale) {
              // Calculate proportional subtotal and tax for this partial payment
              const taxRatio =
                (individualSale.totalTax || 0) /
                (individualSale.grandTotal || 1);
              const taxPart = settlementFromThisItem * taxRatio;
              const subtotalPart = settlementFromThisItem - taxPart;

              // Only increment daily totals if not already fully paid
              if (individualSale.status !== "Completed") {
                saleRecord.daySubtotal += subtotalPart;
                saleRecord.dayTotalTax += taxPart;
                saleRecord.dayGrandTotal += settlementFromThisItem;
              }

              // Update individual sale tracking
              individualSale.paidAmount =
                (individualSale.paidAmount || 0) + settlementFromThisItem;

              // If fully settled, mark as Completed
              if (creditItem.totalAmount <= 0.01) {
                creditItem.totalAmount = 0;
                individualSale.status = "Completed";
              }

              saleRecord.markModified("sales");
            }
          }
        }
      }
    }

    // Save all updated Sale records
    for (const saleRecord of saleRecordsToUpdate.values()) {
      await saleRecord.save({ session });
    }

    // Filter out zeroed credits from the ORIGINAL customer.credits array
    customer.credits = customer.credits.filter((c) => c.totalAmount > 0.01);
    await customer.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "Credit settled successfully",
      data: customer,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Credit settlement error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while settling credit",
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get payment history for a customer
// @route   GET /api/customers/:customerId/payment-history
// @access  Private (Staff/Admin)
exports.getCustomerPaymentHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId)
      .populate("credits.paymentHistory.paymentMethod", "type upiAccountName")
      .populate("credits.paymentHistory.recordedBy", "name email")
      .populate("credits.products", "name code");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Collect all payment history from all credit items
    const allPayments = [];
    customer.credits.forEach((creditItem) => {
      if (creditItem.paymentHistory && creditItem.paymentHistory.length > 0) {
        creditItem.paymentHistory.forEach((payment) => {
          allPayments.push({
            ...payment.toObject(),
            creditItemId: creditItem._id,
            billNumber: creditItem.billNumber,
            products: creditItem.products,
          });
        });
      }
    });

    // Sort by date (most recent first)
    allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      count: allPayments.length,
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
        },
        paymentHistory: allPayments,
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching payment history",
    });
  }
};
