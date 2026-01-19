const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Account = require("../models/Account");
const Branch = require("../models/Branch");
const Inventory = require("../models/Inventory");
const Customer = require("../models/Customer");
const Credit = require("../models/Credit");
const Refund = require("../models/Refund");

// @desc    Create new sale (Daily Storage version)
// @route   POST /api/sales
// @access  Private (Staff/Admin)
exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customer, items, subtotal, totalTax, grandTotal, paymentMethod } =
      req.body;

    const branch = await Branch.findOne({ code: req.user.branchCode }).session(
      session,
    );
    if (!branch) {
      throw new Error("Branch not found for the user");
    }

    // 1. Resolve Customer
    let customerId = customer;
    if (!customerId) {
      let walkIn = await Customer.findOne({
        phone: "0000000000",
        branchCode: req.user.branchCode,
      }).session(session);

      if (!walkIn) {
        walkIn = await Customer.create(
          [
            {
              name: "Walk-in Customer",
              phone: "0000000000",
              city: "Local",
              branch: branch._id,
              branchCode: req.user.branchCode,
            },
          ],
          { session },
        );
        walkIn = walkIn[0];
      }
      customerId = walkIn._id;
    }

    const today = new Date();
    const dateKey = today.toISOString().slice(0, 10);
    const dateStr = dateKey.replace(/-/g, "");

    // 2. Fetch Account
    const account = await Account.findById(paymentMethod).session(session);
    if (!account) {
      throw new Error("Payment account not found");
    }

    const saleStatus = account.type === "Credits" ? "Pending" : "Completed";

    // Increment bill number
    branch.lastBillNumber += 1;
    await branch.save({ session });

    const billNumber = `${req.user.branchCode}-${dateStr}-${branch.lastBillNumber}`;

    const processedItems = items.map((item) => ({
      ...item,
      taxableValue:
        item.taxableValue !== undefined
          ? item.taxableValue
          : item.lineTotal - item.taxAmount,
    }));

    const individualSale = {
      billNumber,
      customer: customerId,
      items: processedItems,
      subtotal,
      totalTax,
      grandTotal,
      paymentMethod,
      staff: req.user.id,
      status: saleStatus,
      paidAmount: saleStatus === "Completed" ? grandTotal : 0,
      createdAt: new Date(),
    };

    // 3. Update/Create Daily Sale Record
    const updateData = {
      $push: { sales: individualSale },
    };

    if (saleStatus === "Completed") {
      updateData.$inc = {
        daySubtotal: subtotal,
        dayTotalTax: totalTax,
        dayGrandTotal: grandTotal,
      };
    }

    const saleRecord = await Sale.findOneAndUpdate(
      { date: dateKey, branch: branch._id },
      updateData,
      { upsert: true, new: true, session },
    );

    // If payment is "Credits", create a new Credit Document
    if (account.type === "Credits") {
      await Credit.create(
        [
          {
            customer: customerId,
            branch: branch._id,
            date: new Date(),
            products: items.map((i) => i.product),
            totalAmount: grandTotal,
            originalAmount: grandTotal,
            sale: saleRecord._id,
            billNumber: billNumber,
            isService: false,
            status: "Pending",
          },
        ],
        { session },
      );
    }

    // 4. Update Account Balance & Daily Session
    const { ensureDailySession } = require("./AccountController");
    const sessionDetail = await ensureDailySession(paymentMethod, session);

    if (!sessionDetail) {
      throw new Error("Failed to resolve account session");
    }

    const { account: updatedAccount, dailySession } = sessionDetail;

    if (dailySession.isClosed) {
      throw new Error(
        "This account is closed for today. Please re-open or use another account.",
      );
    }

    // Update balances
    updatedAccount.currentBalance += grandTotal;
    dailySession.expectedClosingBalance += grandTotal;

    await updatedAccount.save({ session });

    // 5. Update Inventory and validate stock
    for (const item of items) {
      // First check current inventory
      const currentInventory = await Inventory.findOne({
        product: item.product,
        branch: branch._id,
      })
        .populate("product", "name sku")
        .session(session);

      if (!currentInventory) {
        throw new Error(
          `Product not found in inventory. Please add it to branch inventory first.`,
        );
      }

      if (currentInventory.quantity < item.qty) {
        throw new Error(
          `Insufficient stock for ${currentInventory.product.name} (SKU: ${currentInventory.product.sku}). Available: ${currentInventory.quantity}, Required: ${item.qty}`,
        );
      }

      // Update inventory quantity using standard $inc to avoid pipeline error
      const inventoryUpdate = await Inventory.findOneAndUpdate(
        {
          product: item.product,
          branch: branch._id,
          quantity: { $gte: item.qty },
        },
        { $inc: { quantity: -item.qty } },
        { session, new: true },
      );

      if (!inventoryUpdate) {
        throw new Error(
          `Failed to update inventory for ${currentInventory.product.name}`,
        );
      }

      // If quantity becomes 0, mark as inactive
      if (inventoryUpdate.quantity === 0) {
        inventoryUpdate.isActive = false;
        await inventoryUpdate.save({ session });
      }
    }

    // Populate the newly created sale for cleaner response
    const populatedSaleRecord = await Sale.findById(saleRecord._id)
      .populate("sales.staff", "name")
      .populate("sales.customer", "name phone")
      .populate("sales.paymentMethod", "name type")
      .session(session);

    const finalSale =
      populatedSaleRecord.sales[populatedSaleRecord.sales.length - 1];

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: "Sale completed successfully",
      sale: finalSale,
      staff: finalSale.staff, // Sending staff data separately as requested
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Create sale error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating sale",
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get all sales for a branch
// @route   GET /api/sales
// @access  Private (Staff/Admin)
exports.getSales = async (req, res) => {
  try {
    const branch = await Branch.findOne({ code: req.user.branchCode });
    if (!branch && req.user.role !== "admin") {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const query = req.user.role === "admin" ? {} : { branch: branch._id };

    const dailyRecords = await Sale.find(query)
      .populate(
        "sales.paymentMethod services.paymentMethod",
        "name type upiAccountName",
      )
      .populate("sales.staff services.staff", "name")
      .populate("sales.customer services.customer", "name phone city") // Removed credits
      .populate("sales.items.product", "name sku gstType gst")
      .sort({ date: -1 });

    // Extract all Bill Numbers to fetch relevant Credits in one go
    const allBillNumbers = [];
    dailyRecords.forEach((record) => {
      record.sales.forEach((s) => s && allBillNumbers.push(s.billNumber));
      record.services.forEach((s) => s && allBillNumbers.push(s.billNumber));
    });

    const relatedCredits = await Credit.find({
      billNumber: { $in: allBillNumbers },
    });

    // Create a Map for quick lookup: billNumber -> Credit Document
    const creditMap = new Map();
    relatedCredits.forEach((c) => creditMap.set(c.billNumber, c));

    const flattenedSales = dailyRecords.reduce((acc, record) => {
      const recordsToProcess = [];

      if (record.sales) {
        record.sales.forEach((s) => {
          if (s)
            recordsToProcess.push({
              ...(s.toObject ? s.toObject() : s),
              isService: false,
            });
        });
      }

      if (record.services) {
        record.services.forEach((s) => {
          if (s)
            recordsToProcess.push({
              ...(s.toObject ? s.toObject() : s),
              isService: true,
            });
        });
      }

      const salesWithMeta = recordsToProcess.map((saleObj) => {
        // Real-time Sync: Calculate paidAmount from Credit collection if it's a credit sale
        let livePaidAmount = saleObj.paidAmount || 0;

        if (saleObj.paymentMethod?.type === "Credits") {
          const matchingCredit = creditMap.get(saleObj.billNumber);
          if (matchingCredit) {
            const ledgerTotal = (matchingCredit.paymentHistory || []).reduce(
              (sum, p) => sum + (p.amount || 0),
              0,
            );
            livePaidAmount = Math.max(livePaidAmount, ledgerTotal);
          }
        }

        // Real-time Status Sync: If net balance is zero, it's effectively Paid
        const netRemaining =
          (saleObj.grandTotal || 0) - (saleObj.totalRefundedAmount || 0);
        let finalStatus = saleObj.status;

        if (saleObj.status !== "Refunded" && saleObj.status !== "Cancelled") {
          if (livePaidAmount >= netRemaining - 0.01) {
            finalStatus = "Completed";
          }
        }

        return {
          ...saleObj,
          status: finalStatus,
          paidAmount: livePaidAmount,
          branchId: record.branch,
          dateStr: record.date, // YYYY-MM-DD from parent record
        };
      });
      return acc.concat(salesWithMeta);
    }, []);

    // Safe sorting with Date parsing
    flattenedSales.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    // Note: Refund import was missing in previous edit, adding it back via separate edit or assuming it's there?
    // Wait, I messed up the imports in the previous step. I need to fix imports first or here.
    // I cannot import here. I will assume I fix imports in a separate step or just ignore Refund for GET sales.
    // But this block is just the GET sales part.
    // The previous block I edited was CREATE sales.
    // Refund usage is in REFUND endpoint which is AFTER this block.
    // So if I only edit this block I am fine.

    // I need to make sure I don't break the Refund functionality down below.
    // But since I am replacing only getSales...
    const refunds = await Refund.find(query)
      .populate("originalSale", "billNumber")
      .populate("customer", "name phone")
      .populate("staff", "name")
      .populate("items.product", "name sku")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: flattenedSales.length,
      data: flattenedSales,
      refunds: refunds,
    });
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sales",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// @desc    Refund a sale (Partial or Full)
// @route   POST /api/sales/refund
// @access  Private (Staff/Admin)
exports.refundSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { saleId, saleDate, itemsToRefund, reason } = req.body;

    if (!saleId || !saleDate || !itemsToRefund || !reason) {
      throw new Error("Missing required refund details");
    }

    // 1. Find the daily sale record containing this transaction
    const dailyRecord = await Sale.findOne({
      $or: [{ "sales._id": saleId }, { "services._id": saleId }],
      date: saleDate,
    }).session(session);

    if (!dailyRecord) {
      throw new Error("Transaction record not found for the specified date");
    }

    let individualSale = dailyRecord.sales.id(saleId);
    let isServiceRefund = false;

    if (!individualSale) {
      individualSale = dailyRecord.services.id(saleId);
      isServiceRefund = true;
    }

    if (!individualSale) {
      throw new Error("Specific transaction ID not found in daily record");
    }
    if (
      individualSale.status === "Cancelled" ||
      individualSale.status === "Refunded"
    ) {
      throw new Error(
        `Cannot refund a transaction with status: ${individualSale.status}`,
      );
    }

    let batchRefundAmount = 0;
    const itemsForRefundRecord = [];

    // 2. Process each item to refund
    for (const refundReq of itemsToRefund) {
      const saleItem = individualSale.items.id(refundReq.itemId);
      if (!saleItem) continue;

      const remainingQty = saleItem.qty - (saleItem.refundedQty || 0);
      if (refundReq.qtyToRefund > remainingQty) {
        throw new Error(
          `Cannot refund more than available quantity for ${saleItem.product}`,
        );
      }

      // Calculate proportional refund amount (unit price * qty)
      // Note: This implementation assumes simple price-based refund.
      // If there were complex discounts, we might need more logic.
      const itemRefundAmount =
        (saleItem.lineTotal / saleItem.qty) * refundReq.qtyToRefund;
      batchRefundAmount += itemRefundAmount;

      // Update sale item
      saleItem.refundedQty =
        (saleItem.refundedQty || 0) + refundReq.qtyToRefund;

      itemsForRefundRecord.push({
        product: saleItem.product,
        qty: refundReq.qtyToRefund,
        refundAmount: itemRefundAmount,
      });

      // 3. Restore to Inventory (DISABLED as requested: Refunded products should not increase stock)
      /* 
      const inventoryUpdate = await Inventory.findOneAndUpdate(
        {
          product: saleItem.product,
          branch: dailyRecord.branch,
        },
        {
          $inc: { quantity: refundReq.qtyToRefund },
          $set: { isActive: true },
        },
        { session, new: true }
      );

      if (!inventoryUpdate) {
        throw new Error("Failed to restore inventory");
      }
      */
    }

    if (batchRefundAmount === 0) {
      throw new Error("No items were processed for refund");
    }

    // 4. Create Refund Record
    const refundDoc = await Refund.create(
      [
        {
          originalSale: dailyRecord._id,
          billNumber: individualSale.billNumber,
          customer: individualSale.customer,
          branch: dailyRecord.branch,
          items: itemsForRefundRecord,
          totalRefundedAmount: batchRefundAmount,
          reason,
          staff: req.user.id,
          dateStr: new Date().toISOString().split("T")[0],
        },
      ],
      { session },
    );

    // 5. Update individual sale status and totals
    individualSale.totalRefundedAmount =
      (individualSale.totalRefundedAmount || 0) + batchRefundAmount;

    // Status will be updated below after daily total and paidAmount adjustments

    // 6. Update Daily Totals and realized paidAmount
    let amountToDeductFromDaily = 0;

    // We need to check if this was a credit sale to handle partial revenue deduction
    const tempAccount = await Account.findById(
      individualSale.paymentMethod,
    ).session(session);
    if (tempAccount && tempAccount.type === "Credits") {
      const existingCredit = await Credit.findOne({
        billNumber: individualSale.billNumber,
        customer: individualSale.customer,
      }).session(session);

      const remainingDebtBefore = existingCredit
        ? existingCredit.totalAmount
        : 0;
      // If refund is larger than remaining debt, the surplus reduces "realized" cash revenue
      // If no debt left (already settled), the whole refund reduces realized cash revenue
      amountToDeductFromDaily = Math.max(
        0,
        batchRefundAmount - remainingDebtBefore,
      );
    } else {
      // For Cash/UPI sales, full refund amount is deducted from daily revenue
      amountToDeductFromDaily = batchRefundAmount;
    }

    if (amountToDeductFromDaily > 0) {
      const taxRatio =
        (individualSale.totalTax || 0) / (individualSale.grandTotal || 1);
      const taxPart = amountToDeductFromDaily * taxRatio;
      const subtotalPart = amountToDeductFromDaily - taxPart;

      if (isServiceRefund) {
        dailyRecord.serviceDayGrandTotal -= amountToDeductFromDaily;
        dailyRecord.serviceDaySubtotal -= subtotalPart;
        dailyRecord.serviceDayTotalTax -= taxPart;
      } else {
        dailyRecord.dayGrandTotal -= amountToDeductFromDaily;
        dailyRecord.daySubtotal -= subtotalPart;
        dailyRecord.dayTotalTax -= taxPart;
      }
    }

    // Update the record of how much is "paid" on this sale and actual cash impact
    individualSale.paidAmount = Math.max(
      0,
      (individualSale.paidAmount || 0) - amountToDeductFromDaily,
    );
    individualSale.cashRefundAmount =
      (individualSale.cashRefundAmount || 0) + amountToDeductFromDaily;

    // 6.1 Update Status based on remaining balance
    const netTotal =
      individualSale.grandTotal - individualSale.totalRefundedAmount;
    const allItemsFullyRefunded = individualSale.items.every(
      (item) => (item.refundedQty || 0) === item.qty,
    );

    if (allItemsFullyRefunded) {
      individualSale.status = "Refunded";
    } else if (individualSale.paidAmount >= netTotal - 0.01) {
      // If remaining items are fully covered by payments, status is Completed (Paid)
      individualSale.status = "Completed";
    } else {
      individualSale.status = "Partially Refunded";
    }

    if (isServiceRefund) {
      dailyRecord.markModified("services");
    } else {
      dailyRecord.markModified("sales");
    }
    await dailyRecord.save({ session });

    // 7. Update Account Balances
    const { ensureDailySession } = require("./AccountController");
    const account = await Account.findById(
      individualSale.paymentMethod,
    ).session(session);

    if (account && account.type === "Credits") {
      const existingCredit = await Credit.findOne({
        billNumber: individualSale.billNumber,
        customer: individualSale.customer,
      }).session(session);

      const remainingDebt = existingCredit ? existingCredit.totalAmount : 0;
      const debtReduction = Math.min(batchRefundAmount, remainingDebt);
      const cashSurplus = batchRefundAmount - debtReduction;

      // 7a. Reduce Debt in Credits Account
      if (debtReduction > 0) {
        const creditSessionDetail = await ensureDailySession(
          account._id,
          session,
        );
        if (creditSessionDetail) {
          creditSessionDetail.account.currentBalance -= debtReduction;
          creditSessionDetail.dailySession.expectedClosingBalance -=
            debtReduction;
          await creditSessionDetail.account.save({ session });
        }
      }

      // 7b. Deduct Surplus from Cash Account (Staff returns physical cash)
      if (cashSurplus > 0) {
        const cashAccount = await Account.findOne({
          branch: dailyRecord.branch,
          type: "Cash",
        }).session(session);

        if (cashAccount) {
          const cashSessionDetail = await ensureDailySession(
            cashAccount._id,
            session,
          );
          if (cashSessionDetail) {
            cashSessionDetail.account.currentBalance -= cashSurplus;
            cashSessionDetail.dailySession.expectedClosingBalance -=
              cashSurplus;
            await cashSessionDetail.account.save({ session });
          }
        }
      }

      // 8. Update Credit Document directly (Debt only, no store credit)
      if (existingCredit) {
        const amountBefore = existingCredit.totalAmount;
        existingCredit.totalAmount -= debtReduction;
        const amountAfter = Math.max(0, existingCredit.totalAmount);

        if (!existingCredit.paymentHistory) existingCredit.paymentHistory = [];
        existingCredit.paymentHistory.push({
          date: new Date(),
          amount: debtReduction,
          paymentMethod: individualSale.paymentMethod, // Original payment method ID
          paymentMethodName: "Product Return",
          billNumber: existingCredit.billNumber,
          amountBefore: amountBefore,
          amountAfter: amountAfter,
          notes: `Debt Reduction (Return): ${reason}`,
          recordedBy: req.user._id,
        });

        // Update status
        if (existingCredit.totalAmount <= 0.01) {
          existingCredit.status = "Settled";
          existingCredit.totalAmount = 0;
        } else {
          existingCredit.status = "Partial";
        }
        await existingCredit.save({ session });
      }
    } else {
      // Standard Cash/UPI Refund
      const sessionDetail = await ensureDailySession(
        individualSale.paymentMethod,
        session,
      );
      if (sessionDetail) {
        sessionDetail.account.currentBalance -= batchRefundAmount;
        sessionDetail.dailySession.expectedClosingBalance -= batchRefundAmount;
        await sessionDetail.account.save({ session });
      }
    }

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      refund: refundDoc[0],
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Refund error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while processing refund",
    });
  } finally {
    session.endSession();
  }
};
