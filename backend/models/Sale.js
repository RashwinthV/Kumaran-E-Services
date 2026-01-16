const mongoose = require("mongoose");
const { Schema } = mongoose;

const saleItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxAmount: { type: Number, required: true },
  taxableValue: { type: Number, default: 0 }, // New: for GST reporting
  lineTotal: { type: Number, required: true },
  refundedQty: { type: Number, default: 0 },
});

const individualSaleSchema = new Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true, // Ensured global uniqueness
    sparse: true, // Added sparse to handle potential legacy/null issues
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true, // Now required to ensure clean data as per request
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  totalTax: {
    type: Number,
    required: true,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  staff: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: [
      "Completed",
      "Pending",
      "Refunded",
      "Partially Refunded",
      "Paid",
      "Cancelled",
    ],
    default: "Completed",
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  totalRefundedAmount: {
    type: Number,
    default: 0,
  },
  cashRefundAmount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const saleSchema = new Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    sales: [individualSaleSchema],
    daySubtotal: {
      type: Number,
      default: 0,
    },
    dayTotalTax: {
      type: Number,
      default: 0,
    },
    dayGrandTotal: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

saleSchema.index({ date: 1, branch: 1 }, { unique: true });

const SaleModel = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

// Cleanup legacy index that causes E11000 errors on top-level billNumber
if (SaleModel.collection) {
  SaleModel.collection
    .dropIndex("billNumber_1")
    .then(() => console.log("Successfully dropped legacy billNumber_1 index"))
    .catch((err) => {
      // Index might not exist, which is fine
      if (err.code !== 27) {
        console.log("Note regarding billNumber_1 index:", err.message);
      }
    });
}

module.exports = SaleModel;
