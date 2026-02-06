const Customer = require("../models/Customer");
const Branch = require("../models/Branch");
const Account = require("../models/Account");
const Sale = require("../models/Sale");
const mongoose = require("mongoose");
const { ensureDailySession } = require("./AccountController");

// @desc    Get all investors for a branch
// @route   GET /api/customers/investors/my-branch
// @access  Private (Staff/Admin)
exports.getBranchInvestors = async (req, res) => {
  try {
    const result = await Customer.find({
      branchCode: req.user.branchCode,
      role: { $in: ["Investor", "Customer & investor"] },
    }).sort({ name: 1 });

    // Extract all unique saleIds for manual population
    const saleIds = [];
    result.forEach((customer) => {
      customer.investmentDetails?.forEach((investment) => {
        investment.interestHistory?.forEach((history) => {
          if (history.saleId) {
            saleIds.push(history.saleId);
          }
        });
      });
    });

    // Fetch matching sales if any saleIds exist
    let billMap = {};
    if (saleIds.length > 0) {
      const parentSales = await Sale.find({
        "sales._id": { $in: saleIds },
      });
      parentSales.forEach((parent) => {
        parent.sales.forEach((s) => {
          if (saleIds.some((id) => id.toString() === s._id.toString())) {
            billMap[s._id.toString()] = s.billNumber;
          }
        });
      });
    }

    // Filter out soft-deleted investments and enrich with bill numbers
    const investors = result
      .map((customer) => {
        const doc = customer.toObject({ getters: true });
        if (doc.investmentDetails) {
          doc.investmentDetails = doc.investmentDetails
            .filter((inv) => !inv.isDeleted)
            .map((investment) => {
              if (investment.interestHistory) {
                investment.interestHistory = investment.interestHistory.map(
                  (history) => {
                    if (history.saleId && billMap[history.saleId.toString()]) {
                      return {
                        ...history,
                        // Inject billNumber into history record
                        billNumber: billMap[history.saleId.toString()],
                        // Optionally also populate saleId object structure if frontend expects it
                        saleId: {
                          _id: history.saleId,
                          billNumber: billMap[history.saleId.toString()],
                        },
                      };
                    }
                    return history;
                  },
                );
              }
              return investment;
            });
        }
        return doc;
      })
      .filter((customer) => customer.investmentDetails.length > 0);

    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllBranchInvestors = async (req, res) => {
  try {
    const result = await Customer.find({
      role: { $in: ["Investor", "Customer & investor"] },
    })
      .populate("branch", "name branchCode contact address gstNumber")
      .sort({ name: 1 });

    // Extract all unique saleIds for manual population
    const saleIds = [];
    result.forEach((customer) => {
      customer.investmentDetails?.forEach((investment) => {
        investment.interestHistory?.forEach((history) => {
          if (history.saleId) {
            saleIds.push(history.saleId);
          }
        });
      });
    });

    // Fetch matching sales if any saleIds exist
    let billMap = {};
    if (saleIds.length > 0) {
      const parentSales = await Sale.find({
        "sales._id": { $in: saleIds },
      });
      parentSales.forEach((parent) => {
        parent.sales.forEach((s) => {
          if (saleIds.some((id) => id.toString() === s._id.toString())) {
            billMap[s._id.toString()] = s.billNumber;
          }
        });
      });
    }

    // Filter out soft-deleted investments and enrich with bill numbers
    const investors = result
      .map((customer) => {
        const doc = customer.toObject({ getters: true });
        if (doc.investmentDetails) {
          doc.investmentDetails = doc.investmentDetails
            .filter((inv) => !inv.isDeleted)
            .map((investment) => {
              if (investment.interestHistory) {
                investment.interestHistory = investment.interestHistory.map(
                  (history) => {
                    if (history.saleId && billMap[history.saleId.toString()]) {
                      return {
                        ...history,
                        // Inject billNumber into history record
                        billNumber: billMap[history.saleId.toString()],
                        // Optionally also populate saleId object structure if frontend expects it
                        saleId: {
                          _id: history.saleId,
                          billNumber: billMap[history.saleId.toString()],
                        },
                      };
                    }
                    return history;
                  },
                );
              }
              return investment;
            });
        }
        return doc;
      })
      .filter((customer) => customer.investmentDetails.length > 0);

    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all customers for a branch
// @route   GET /api/customers/my-branch
// @access  Private (Staff/Admin)
exports.getMyBranchCustomers = async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $match: { branchCode: req.user.branchCode },
      },
      {
        $lookup: {
          from: "credits", // Collection name is usually lowercase plural
          localField: "_id",
          foreignField: "customer",
          as: "credits",
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          phone: 1,
          city: 1,
          email: 1,
          role: 1,
          branch: 1,
          branchCode: 1,
          credits: 1, // Return all credits (Active & Settled)
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);
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

// @desc    Get all customers (Admin)
// @route   GET /api/customers
// @access  Private (Admin/Manager)
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $lookup: {
          from: "credits", // Collection name is usually lowercase plural
          localField: "_id",
          foreignField: "customer",
          as: "credits",
        },
      },
      {
        $lookup: {
          from: "branches", // Collection name for Branch model
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          phone: 1,
          city: 1,
          email: 1,
          role: 1,
          branch: 1,
          branchCode: 1,
          investmentDetails: 1, // Include investment details for investors page
          credits: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);
    res.status(200).json({
      success: true,
      count: customers.length,
      customers: customers, // Key matches frontend expectation
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name,
      phone,
      email,
      city,
      role,
      branchId,
      investorDetails,
      initialPaymentAccountId,
    } = req.body;

    // Determine target branch
    let branch;
    if (
      branchId &&
      (req.user.role === "admin" || req.user.role === "manager")
    ) {
      branch = await Branch.findById(branchId).session(session);
    } else {
      branch = await Branch.findOne({ code: req.user.branchCode }).session(
        session,
      );
    }

    if (!branch) {
      throw new Error("Branch not found");
    }

    const targetBranchCode = branch.code;

    // Try to find by phone within the target branch
    let customer = await Customer.findOne({
      phone,
      branchCode: targetBranchCode,
    }).session(session);

    let isNewInvestment = false;
    let transactionAmount = 0;

    if (customer) {
      customer.name = name;
      customer.city = city;
      if (email) customer.email = email;

      if (role === "Investor" && customer.role === "customer") {
        customer.role = "Customer & investor";
      } else if (role) {
        customer.role = role;
      }

      if (investorDetails) {
        if (!customer.investmentDetails) customer.investmentDetails = [];

        let investmentFound = false;
        if (investorDetails._id) {
          const idx = customer.investmentDetails.findIndex(
            (inv) => inv._id.toString() === investorDetails._id,
          );
          if (idx !== -1) {
            Object.assign(customer.investmentDetails[idx], investorDetails);
            investmentFound = true;
          }
        } else if (investorDetails.id) {
          const idx = customer.investmentDetails.findIndex(
            (inv) => inv._id.toString() === investorDetails.id,
          );
          if (idx !== -1) {
            Object.assign(customer.investmentDetails[idx], investorDetails);
            investmentFound = true;
          }
        }

        if (!investmentFound) {
          // Generate static Certificate Number for new investment
          investorDetails.certNo = `INV-CERT-${Math.floor(100000 + Math.random() * 900000)}`;
          customer.investmentDetails.push(investorDetails);
          isNewInvestment = true;
          // Use the principal amount from the new details
          transactionAmount = parseFloat(investorDetails.principalAmount || 0);
        }
      }
      await customer.save({ session });
    } else {
      const newCustomerData = {
        name,
        phone,
        email,
        city,
        role: role || "customer",
        branch: branch._id,
        branchCode: targetBranchCode,
      };

      if (investorDetails) {
        // Generate static Certificate Number for new investment
        investorDetails.certNo = `INV-CERT-${Math.floor(100000 + Math.random() * 900000)}`;
        newCustomerData.investmentDetails = [investorDetails];
        isNewInvestment = true;
        transactionAmount = parseFloat(investorDetails.principalAmount || 0);
      }

      const created = await Customer.create([newCustomerData], { session });
      customer = created[0];
    }

    // Handle Financial Transaction for Initial Investment
    if (isNewInvestment && initialPaymentAccountId && transactionAmount > 0) {
      const account = await Account.findById(initialPaymentAccountId).session(
        session,
      );
      if (!account) {
        throw new Error("Generic Error: Selected payment account not found");
      }

      const { ensureDailySession } = require("./AccountController");
      const sessionDetail = await ensureDailySession(
        initialPaymentAccountId,
        session,
      );

      if (!sessionDetail) {
        throw new Error("Failed to resolve account session");
      }

      if (sessionDetail.dailySession.isClosed) {
        throw new Error("Selected account is closed for today");
      }

      // Credit the account (Money In)
      sessionDetail.account.currentBalance += transactionAmount;
      sessionDetail.dailySession.expectedClosingBalance += transactionAmount;
      await sessionDetail.account.save({ session });
    }

    await session.commitTransaction();

    const populatedCustomer = await Customer.findById(customer._id).populate(
      "branch",
      "name branchCode contact address gstNumber",
    );

    res.status(200).json({
      success: true,
      data: populatedCustomer,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Upsert customer error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
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
  const Credit = require("../models/Credit"); // Ensure model is available
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId } = req.params;
    const { amount, paymentMethod, creditItemIds, notes, itemSettlements } =
      req.body;

    if (!paymentMethod) {
      throw new Error("Payment method is required");
    }

    // 1. Get Customer (just to verify existence and branch)
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // 2. Fetch Active Credits for this Customer
    const customerCredits = await Credit.find({
      customer: customerId,
      totalAmount: { $gt: 0.01 },
    })
      .sort({ date: 1 }) // FIFO by default
      .session(session);

    const totalOutstanding = customerCredits.reduce(
      (sum, c) => sum + c.totalAmount,
      0,
    );

    // Calculate total settlement amount
    let settlementAmount = 0;
    if (itemSettlements && itemSettlements.length > 0) {
      settlementAmount = itemSettlements.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0,
      );
    } else if (creditItemIds && creditItemIds.length > 0) {
      const itemsToSettle = customerCredits.filter((c) =>
        creditItemIds.includes(c._id.toString()),
      );
      settlementAmount = itemsToSettle.reduce(
        (sum, c) => sum + c.totalAmount,
        0,
      );
    } else {
      settlementAmount = parseFloat(amount);
    }

    if (isNaN(settlementAmount) || settlementAmount <= 0) {
      throw new Error("Invalid settlement amount");
    }

    if (settlementAmount > totalOutstanding + 0.01) {
      throw new Error(
        `Settlement amount (₹${settlementAmount}) exceeds total outstanding (₹${totalOutstanding})`,
      );
    }

    // 3. Resolve Accounts
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

    // 4. Update Balances & Daily Sessions
    const destSessionData = await ensureDailySession(paymentMethod, session);
    const creditsSessionData = await ensureDailySession(
      creditsAccount._id,
      session,
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

    // 5. Update Credit Documents & Billing Status
    const saleRecordsToUpdate = new Map();

    if (itemSettlements && itemSettlements.length > 0) {
      // Process specific settlements per bill
      for (const item of itemSettlements) {
        const creditItem = customerCredits.find(
          (c) => c._id.toString() === item.id,
        );
        if (!creditItem) continue;

        const settleAmt = parseFloat(item.amount);
        if (settleAmt <= 0) continue;

        const amountBefore = creditItem.totalAmount;
        creditItem.totalAmount -= settleAmt;
        const amountAfter = Math.max(0, creditItem.totalAmount);

        if (!creditItem.paymentHistory) creditItem.paymentHistory = [];

        // Get payment method name
        let paymentMethodName = "Unknown";
        if (destAccount.type === "Upi" && destAccount.upiAccountName) {
          paymentMethodName = destAccount.upiAccountName;
        } else {
          paymentMethodName = destAccount.type;
        }

        creditItem.paymentHistory.push({
          date: new Date(),
          amount: settleAmt,
          paymentMethod: paymentMethod,
          paymentMethodName: paymentMethodName,
          // creditItem self ref is implicit in document
          billNumber: creditItem.billNumber,
          amountBefore: amountBefore,
          amountAfter: amountAfter,
          notes: notes || `Partial payment of ₹${settleAmt}`,
          recordedBy: req.user._id,
        });

        if (creditItem.totalAmount <= 0.01) {
          creditItem.status = "Settled";
          creditItem.totalAmount = 0;
        } else {
          creditItem.status = "Partial";
        }

        await creditItem.save({ session });

        // Update Sale History logic (keeping it consistent with previous logic)
        if (creditItem.sale && creditItem.billNumber) {
          let saleRecord = saleRecordsToUpdate.get(creditItem.sale.toString());
          if (!saleRecord) {
            saleRecord = await Sale.findById(creditItem.sale).session(session);
            if (saleRecord)
              saleRecordsToUpdate.set(creditItem.sale.toString(), saleRecord);
          }

          if (saleRecord) {
            const targetBill = (creditItem.billNumber || "").trim();
            const individualSale =
              saleRecord.sales.find(
                (s) => (s.billNumber || "").trim() === targetBill,
              ) ||
              saleRecord.services.find(
                (s) => (s.billNumber || "").trim() === targetBill,
              );

            if (individualSale) {
              const taxRatio =
                (individualSale.totalTax || 0) /
                (individualSale.grandTotal || 1);
              const taxPart = settleAmt * taxRatio;
              const subtotalPart = settleAmt - taxPart;

              const alreadyPaid = individualSale.status === "Completed";
              if (!alreadyPaid) {
                // Determine if it was a service sale or product sale
                if (individualSale.fieldService || individualSale.isService) {
                  saleRecord.serviceDaySubtotal += subtotalPart;
                  saleRecord.serviceDayTotalTax += taxPart;
                  saleRecord.serviceDayGrandTotal += settleAmt;
                } else {
                  saleRecord.daySubtotal += subtotalPart;
                  saleRecord.dayTotalTax += taxPart;
                  saleRecord.dayGrandTotal += settleAmt;
                }
              }

              individualSale.paidAmount =
                (individualSale.paidAmount || 0) + settleAmt;

              if (creditItem.totalAmount <= 0.01) {
                individualSale.status = "Completed";
              }

              if (individualSale.fieldService || individualSale.isService) {
                saleRecord.markModified("services");
              } else {
                saleRecord.markModified("sales");
              }
            }
          }
        }
      }
    } else {
      // FIFO Logic
      let remainingToSettle = settlementAmount;
      let creditItemsToProcess = [];

      if (creditItemIds && creditItemIds.length > 0) {
        creditItemsToProcess = customerCredits.filter((c) =>
          creditItemIds.includes(c._id.toString()),
        );
      } else {
        creditItemsToProcess = customerCredits; // Already sorted by date
      }

      for (
        let i = 0;
        i < creditItemsToProcess.length && remainingToSettle > 0;
        i++
      ) {
        const creditItem = creditItemsToProcess[i];
        const settlementFromThisItem = Math.min(
          creditItem.totalAmount,
          remainingToSettle,
        );

        const amountBefore = creditItem.totalAmount;
        creditItem.totalAmount -= settlementFromThisItem;
        const amountAfter = Math.max(0, creditItem.totalAmount);
        remainingToSettle -= settlementFromThisItem;

        if (!creditItem.paymentHistory) creditItem.paymentHistory = [];

        let paymentMethodName = "Unknown";
        if (destAccount.type === "Upi" && destAccount.upiAccountName) {
          paymentMethodName = destAccount.upiAccountName;
        } else {
          paymentMethodName = destAccount.type;
        }

        creditItem.paymentHistory.push({
          date: new Date(),
          amount: settlementFromThisItem,
          paymentMethod: paymentMethod,
          paymentMethodName: paymentMethodName,
          billNumber: creditItem.billNumber,
          amountBefore: amountBefore,
          amountAfter: amountAfter,
          notes: notes || `Payment of ₹${settlementFromThisItem}`,
          recordedBy: req.user._id,
        });

        if (creditItem.totalAmount <= 0.01) {
          creditItem.status = "Settled";
          creditItem.totalAmount = 0;
        } else {
          creditItem.status = "Partial";
        }

        await creditItem.save({ session });

        // Update Sale Record (same logic as above)
        if (creditItem.sale && creditItem.billNumber) {
          let saleRecord = saleRecordsToUpdate.get(creditItem.sale.toString());
          if (!saleRecord) {
            saleRecord = await Sale.findById(creditItem.sale).session(session);
            if (saleRecord)
              saleRecordsToUpdate.set(creditItem.sale.toString(), saleRecord);
          }

          if (saleRecord) {
            const targetBill = (creditItem.billNumber || "").trim();
            const individualSale =
              saleRecord.sales.find(
                (s) => (s.billNumber || "").trim() === targetBill,
              ) ||
              saleRecord.services.find(
                (s) => (s.billNumber || "").trim() === targetBill,
              );

            if (individualSale) {
              const taxRatio =
                (individualSale.totalTax || 0) /
                (individualSale.grandTotal || 1);
              const taxPart = settlementFromThisItem * taxRatio;
              const subtotalPart = settlementFromThisItem - taxPart;

              const alreadyPaid = individualSale.status === "Completed";
              if (!alreadyPaid) {
                if (individualSale.fieldService || individualSale.isService) {
                  saleRecord.serviceDaySubtotal += subtotalPart;
                  saleRecord.serviceDayTotalTax += taxPart;
                  saleRecord.serviceDayGrandTotal += settlementFromThisItem;
                } else {
                  saleRecord.daySubtotal += subtotalPart;
                  saleRecord.dayTotalTax += taxPart;
                  saleRecord.dayGrandTotal += settlementFromThisItem;
                }
              }

              individualSale.paidAmount =
                (individualSale.paidAmount || 0) + settlementFromThisItem;

              if (creditItem.totalAmount <= 0.01) {
                individualSale.status = "Completed";
              }

              if (individualSale.fieldService || individualSale.isService) {
                saleRecord.markModified("services");
              } else {
                saleRecord.markModified("sales");
              }
            }
          }
        }
      }
    }

    // Save all updated Sale records
    for (const saleRecord of saleRecordsToUpdate.values()) {
      await saleRecord.save({ session });
    }

    // Since we filtered Active credits, and updated them, we don't need to "filter out" from array like before.
    // They just exist with status 'Settled' or 'Partial' in the collection.

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "Credit settled successfully",
      // Optionally return validation of new balance
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
  const Credit = require("../models/Credit");
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId).select("name phone");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Fetch credits from separate collection
    const credits = await Credit.find({ customer: customerId })
      .populate("paymentHistory.paymentMethod", "type upiAccountName")
      .populate("paymentHistory.recordedBy", "name email")
      .populate("products", "name code")
      .sort({ date: -1 });

    // Collect all payment history from all credit items
    const allPayments = [];
    credits.forEach((creditItem) => {
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

// @desc    Check and process investment maturity (Daily Job)
// @route   POST /api/customers/check-maturity
// @access  Private (System/Admin)
exports.checkMaturity = async (req, res) => {
  try {
    const today = new Date();
    // Normalize today to start of day for consistent comparison
    today.setHours(0, 0, 0, 0);

    const investors = await Customer.find({
      role: { $in: ["Investor", "Customer & investor"] },
    });

    let processedCount = 0;

    for (const investor of investors) {
      if (
        !investor.investmentDetails ||
        investor.investmentDetails.length === 0
      )
        continue;

      let investorUpdated = false;

      for (const details of investor.investmentDetails) {
        if (
          details.status !== "active" ||
          details.isDeleted ||
          !details.investments ||
          details.investments.length === 0
        )
          continue;

        // Loop through each individual investment/deposit
        for (const investment of details.investments) {
          if (!investment.date || !investment.amount || investment.amount <= 0)
            continue;

          const investmentDate = new Date(investment.date);
          investmentDate.setHours(0, 0, 0, 0);

          // Determine the last accrual date for this specific investment
          let lastAccrual = investment.lastAccrualDate
            ? new Date(investment.lastAccrualDate)
            : investmentDate;
          lastAccrual.setHours(0, 0, 0, 0);

          let nextAccrualDate = new Date(lastAccrual);
          nextAccrualDate.setMonth(nextAccrualDate.getMonth() + 1);

          // Process all months that have passed (Catch-up logic)
          while (today >= nextAccrualDate) {
            // Calculate interest for this specific investment
            const monthlyInterest =
              (investment.amount * details.interestRate) / 100;

            // Add to total unpaid interest
            details.unpaidInterest =
              (details.unpaidInterest || 0) + monthlyInterest;

            // Update this investment's last accrual date to the month just processed
            lastAccrual = new Date(nextAccrualDate);
            investment.lastAccrualDate = lastAccrual;

            // Mark as matured (means interest has accrued and is pending payout/review)
            investment.isMatured = true;

            investorUpdated = true;
            processedCount++;

            // Increment nextAccrualDate for next possible month
            nextAccrualDate.setMonth(nextAccrualDate.getMonth() + 1);
          }
        }
      }

      if (investorUpdated) {
        investor.markModified("investmentDetails");
        await investor.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed maturity for ${processedCount} investments`,
    });
  } catch (error) {
    console.error("Maturity check error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Process principal transaction (Payin/Payout)
// @route   POST /api/customers/transaction
// @access  Private (Staff/Admin)
exports.processPrincipalTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      customerId,
      investmentId,
      type, // 'payin' or 'payout'
      amount,
      paymentAccountId,
      date,
      mode,
      reference,
      notes,
    } = req.body;

    const transactionAmount = parseFloat(amount);
    if (!transactionAmount || transactionAmount <= 0) {
      throw new Error("Invalid amount");
    }

    // 1. Get Customer & Investment
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) throw new Error("Customer not found");

    if (!customer.investmentDetails) throw new Error("No investments found");

    const investment = customer.investmentDetails.id(investmentId);
    if (!investment) throw new Error("Investment record not found");

    // 2. Perform Account Transaction (if account provided)
    // For Payin: Account increases (Credit)
    // For Payout / Interest Payout: Account decreases (Debit)
    if (paymentAccountId) {
      const { ensureDailySession } = require("./AccountController");
      const sessionDetail = await ensureDailySession(paymentAccountId, session);

      if (!sessionDetail) throw new Error("Failed to resolve account");
      if (sessionDetail.dailySession.isClosed) {
        throw new Error("Selected account is closed for today");
      }

      if (type === "payin") {
        sessionDetail.account.currentBalance += transactionAmount;
        sessionDetail.dailySession.expectedClosingBalance += transactionAmount;
      } else if (type === "payout" || type === "interest_payout") {
        if (sessionDetail.account.currentBalance < transactionAmount) {
          // Optional: Allow negative or throw? Usually warn.
        }
        sessionDetail.account.currentBalance -= transactionAmount;
        sessionDetail.dailySession.expectedClosingBalance -= transactionAmount;
      }

      await sessionDetail.account.save({ session });
    }

    // 3. Update Investment Details
    const currentPrincipal = investment.currentPrincipal || 0;
    const principalAmount = investment.principalAmount || 0;

    if (type === "payin") {
      investment.currentPrincipal = currentPrincipal + transactionAmount;
      investment.principalAmount = principalAmount + transactionAmount;

      // Update investments array (deposit history)
      if (!investment.investments) investment.investments = [];
      investment.investments.push({
        date: date || new Date(),
        amount: transactionAmount,
        type: "additional",
      });
    } else if (type === "payout") {
      if (currentPrincipal < transactionAmount) {
        throw new Error("Insufficient principal balance");
      }
      investment.currentPrincipal = currentPrincipal - transactionAmount;
      // Do we decrease base principal on payout? Depends on logic. Usually yes if it's withdrawal.
      // investment.principalAmount = Math.max(0, principalAmount - transactionAmount);
    } else if (type === "interest_payout") {
      const currentUnpaid = investment.unpaidInterest || 0;
      investment.unpaidInterest = Math.max(
        0,
        currentUnpaid - transactionAmount,
      );
      investment.totalInterestPaid =
        (investment.totalInterestPaid || 0) + transactionAmount;
      investment.lastInterestPaid = date || new Date();
      if (investment.unpaidInterest <= 0.01) {
        if (investment.investments) {
          investment.investments.forEach((inv) => (inv.isMatured = false));
        }
      }

      if (!investment.interestHistory) investment.interestHistory = [];
      investment.interestHistory.push({
        paidDate: date || new Date(), // Changed from date to paidDate to match schema
        amount: transactionAmount,
        mode: mode,
        reference: reference === undefined ? "" : reference,
        notes: notes === undefined ? "" : notes,
        status: "paid",
        month: req.body.month, // Capture month from request for interest
      });

      if (mode === "reinvest") {
        investment.currentPrincipal = currentPrincipal + transactionAmount;
        investment.principalAmount = principalAmount + transactionAmount;

        if (!investment.investments) investment.investments = [];
        investment.investments.push({
          date: date || new Date(),
          amount: transactionAmount,
          type: "interest_capitalization",
        });
      }
    }

    // Update Payout History (Only for principal transactions)
    if (type === "payin" || type === "payout") {
      if (!investment.payoutHistory) investment.payoutHistory = [];
      investment.payoutHistory.push({
        amount: transactionAmount,
        date: date || new Date(),
        type: type, // 'payin' or 'payout'
        mode: mode,
        reference: reference,
        notes: notes,
        previousPrincipal: currentPrincipal,
        newPrincipal: investment.currentPrincipal,
        status: "paid",
      });
    }

    await customer.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: `${type === "payin" ? "Pay-in" : type === "interest_payout" ? "Interest Payment" : "Pay-out"} successful`,
      data: customer,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("Transaction error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Close a specific investment
// @route   POST /api/customers/:customerId/investment/:investmentId/close
// @access  Private (Admin/Manager)
exports.closeInvestment = async (req, res) => {
  try {
    const { customerId, investmentId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    if (!customer.investmentDetails) {
      return res
        .status(404)
        .json({ success: false, message: "No investments found" });
    }

    const investment = customer.investmentDetails.id(investmentId);
    if (!investment) {
      return res
        .status(404)
        .json({ success: false, message: "Investment not found" });
    }

    if (investment.status === "closed") {
      return res
        .status(400)
        .json({ success: false, message: "Investment already closed" });
    }

    investment.status = "closed";
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Investment closed successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Close investment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete an investment
// @route   DELETE /api/customers/:customerId/investments/:investmentId
// @access  Private (Staff/Admin)
exports.deleteInvestorInvestment = async (req, res) => {
  try {
    const { customerId, investmentId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    if (!customer.investmentDetails) {
      return res
        .status(404)
        .json({ success: false, message: "No investments found" });
    }

    const investment = customer.investmentDetails.id(investmentId);
    if (!investment) {
      return res
        .status(404)
        .json({ success: false, message: "Investment not found" });
    }

    investment.isDeleted = true;
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Investment deleted successfully (Soft delete)",
    });
  } catch (error) {
    console.error("Delete investment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
