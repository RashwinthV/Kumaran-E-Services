const mongoose = require("mongoose");
const { Schema } = mongoose;

const serviceComplaintSchema = new Schema(
  {
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    branchCode: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer", // Optional, if linked
    },
    service: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
    },
    formData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ServiceComplaint", serviceComplaintSchema);
