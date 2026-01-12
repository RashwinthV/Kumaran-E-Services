const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  paymentMethodName: {
    type: String, // Store the name for historical reference
  },
  creditItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "creditItemSchema", // Reference to the credit item this payment was applied to
  },
  billNumber: {
    type: String, // Store bill number for easy reference
  },
  amountBefore: {
    type: Number, // Outstanding amount before this payment
  },
  amountAfter: {
    type: Number, // Outstanding amount after this payment
  },
  notes: {
    type: String,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const creditItemSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sale",
  },
  billNumber: {
    type: String,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  originalAmount: {
    type: Number, // Store the original credit amount
  },
  paymentHistory: [paymentHistorySchema], // Track payments made against this credit item
});

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    branchCode: {
      type: String,
      required: true,
      index: true,
    },

    credits: [creditItemSchema],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
