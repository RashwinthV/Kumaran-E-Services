const mongoose = require("mongoose");
const { Schema } = mongoose;

const balanceSchema = new Schema({
  date: { type: Date, required: true, default: Date.now },
  dateStr: { type: String, required: true }, // YYYY-MM-DD
  openingBalance: { type: Number, required: true, default: 0 },
  expectedClosingBalance: { type: Number, required: true, default: 0 },
  closingBalance: { type: Number, default: 0 },
  openingTime: { type: Date, default: Date.now },
  closingTime: { type: Date },
  isClosed: { type: Boolean, default: false },
});

const accountSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Upi", "Cash", "Credits"],
      required: true,
    },
    upiAccountName: {
      type: String,
      required: function () {
        return this.type === "Upi";
      },
      trim: true,
    },
    upiAccountNumber: {
      type: String,
      required: function () {
        return this.type === "Upi";
      },
      trim: true,
    },
    upiId: {
      type: String,
      required: function () {
        return this.type === "Upi";
      },
      trim: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    balanceHistory: [balanceSchema],
    currentBalance: {
      type: Number,
      default: 0,
    },
    currentStatus: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Deleted"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for display name
accountSchema.virtual("name").get(function () {
  return this.type === "Upi" ? this.upiAccountName : this.type;
});

// Pre-validate hook to fix legacy data and ensure dateStr is present
accountSchema.pre("validate", function () {
  if (this.balanceHistory && this.balanceHistory.length > 0) {
    this.balanceHistory.forEach((entry) => {
      // Ensure dateStr is present (required by schema)
      if (!entry.dateStr) {
        entry.dateStr = new Date(entry.date || Date.now())
          .toISOString()
          .split("T")[0];
      }
      // Ensure expectedClosingBalance is present
      if (entry.expectedClosingBalance === undefined) {
        entry.expectedClosingBalance =
          entry.closingBalance || entry.openingBalance || 0;
      }
    });
  }
});

module.exports =
  mongoose.models.Account || mongoose.model("Account", accountSchema);
