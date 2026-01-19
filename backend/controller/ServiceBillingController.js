const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Account = require("../models/Account");
const Branch = require("../models/Branch");
const Customer = require("../models/Customer");
const Credit = require("../models/Credit");

// @desc    Create new service billing (stored in services array of Sale collection)
// @route   POST /api/services
// @access  Private (Staff/Admin)
exports.createServiceSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      customer,
      items,
      subtotal,
      totalTax,
      grandTotal,
      paymentMethod,
      fieldService,
    } = req.body;

    const branch = await Branch.findOne({ code: req.user.branchCode }).session(
      session,
    );
    if (!branch) throw new Error("Branch not found");

    // Resolve Customer
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

    const account = await Account.findById(paymentMethod).session(session);
    if (!account) throw new Error("Payment account not found");

    const saleStatus = account.type === "Credits" ? "Pending" : "Completed";

    // Increment bill number
    branch.lastBillNumber += 1;
    await branch.save({ session });

    const billNumber = `${req.user.branchCode}-${dateStr}-${branch.lastBillNumber}`;

    const individualSale = {
      billNumber,
      customer: customerId,
      items,
      subtotal,
      totalTax,
      grandTotal,
      paymentMethod,
      staff: req.user.id,
      status: saleStatus,
      paidAmount: saleStatus === "Completed" ? grandTotal : 0,
      fieldService: fieldService || "",
      createdAt: new Date(),
    };

    // Update Daily Record
    const updateData = {
      $push: { services: individualSale },
    };

    if (saleStatus === "Completed") {
      updateData.$inc = {
        serviceDaySubtotal: subtotal,
        serviceDayTotalTax: totalTax,
        serviceDayGrandTotal: grandTotal,
      };
    }

    const saleRecord = await Sale.findOneAndUpdate(
      { date: dateKey, branch: branch._id },
      updateData,
      { upsert: true, new: true, session },
    );

    // Handle Credits if applicable
    if (account.type === "Credits") {
      await Credit.create(
        [
          {
            customer: customerId,
            branch: branch._id,
            date: new Date(),
            products: [], // Services don't have product IDs in the same way, or fetch IDs if needed
            totalAmount: grandTotal,
            originalAmount: grandTotal,
            sale: saleRecord._id,
            billNumber: billNumber,
            isService: true,
            status: "Pending",
          },
        ],
        { session },
      );
    }

    // Update Account Balance
    const { ensureDailySession } = require("./AccountController");
    const sessionDetail = await ensureDailySession(paymentMethod, session);
    if (sessionDetail) {
      sessionDetail.account.currentBalance += grandTotal;
      sessionDetail.dailySession.expectedClosingBalance += grandTotal;
      await sessionDetail.account.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: "Service billing completed successfully",
      sale: individualSale,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
