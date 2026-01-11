const mongoose = require("mongoose");
const { Schema } = mongoose;

const refundItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  refundAmount: {
    type: Number,
    required: true,
  },
});

const refundSchema = new Schema(
  {
    originalSale: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    billNumber: {
      type: String,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    items: [refundItemSchema],
    totalRefundedAmount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateStr: {
      type: String, // YYYY-MM-DD for reporting consistency
      required: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Refund || mongoose.model("Refund", refundSchema);
