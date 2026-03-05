const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    //barcode
    sku: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },

    // Unit of Measurement (e.g., kg, pcs, ltr)
    unit: {
      type: String,
      required: true,
      trim: true,
      default: "pcs",
    },

    // GST details
    gstType: {
      type: String,
      enum: ["Included", "NotIncluded", "NotApplicable"],
      default: "NotIncluded",
      required: true,
    },
    gst: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      isGstApplicable: { type: Boolean, default: true },
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    tags: [{ type: String, trim: true, index: true }],
    compatibleModels: [{ type: String, trim: true, index: true }],
    brand: { type: String, trim: true, index: true },
    model: { type: String, trim: true, index: true },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
