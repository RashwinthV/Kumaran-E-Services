const mongoose = require("mongoose");
const { Schema } = mongoose;

const expenseSchema = new Schema(
  {
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Product", "Employee", "Rent", "Other"],
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentAccount: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      // Category-specific details
      productName: String,
      quantity: Number,
      unitPrice: Number,
      supplier: String,
      employeeName: String,
      employeePaymentType: String, // salary, advance
      daysWorked: Number,
      payPerDay: Number,
      salaryFromDate: Date,
      salaryToDate: Date,
      bonus: Number,
      deductions: Number,
      propertyName: String,
      rentPeriod: String,
      landlord: String,
      otherCategory: String, // sub-category for 'Other'
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
