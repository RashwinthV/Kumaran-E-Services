const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentHistorySchema = new Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  paymentMethod: { type: Schema.Types.ObjectId, ref: "Account" },
  paymentMethodName: { type: String }, // historical
  billNumber: { type: String },
  amountBefore: { type: Number },
  amountAfter: { type: Number },
  notes: { type: String },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

const creditSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    sale: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    billNumber: {
      type: String,
      required: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // For service repairs or specific transaction logging
    isService: {
      type: Boolean,
      default: false,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number, // This handles the remaining balance (outstanding)
      required: true,
    },
    paymentHistory: [paymentHistorySchema],
    status: {
      type: String,
      enum: ["Pending", "Partial", "Settled"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Credit", creditSchema);
