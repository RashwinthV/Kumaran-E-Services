const mongoose = require("mongoose");

const { encrypt, decrypt } = require("../utils/encryptionUtils");

const investorDetailsSchema = new mongoose.Schema(
  {
    principalAmount: { type: Number, default: 0 },
    currentPrincipal: { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    interestType: {
      type: String,
      enum: ["simple", "compound"],
      default: "simple",
    },
    startDate: { type: Date },
    lastInterestPaid: { type: Date },
    totalInterestPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "closed"],
      default: "active",
    },
    paymentMode: { type: String },
    investorType: {
      type: String,
      enum: ["individual", "business"],
      default: "individual",
    },
    panNumber: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    aadharNumber: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    preferredPayoutMode: { type: String },
    bankAccounts: [
      {
        accountHolderName: String,
        bankName: String,
        accountNumber: {
          type: String,
          get: decrypt,
          set: encrypt,
        },
        ifsc: {
          type: String,
          get: decrypt,
          set: encrypt,
        },
        isDefault: Boolean,
      },
    ],
    upiAccounts: [
      {
        upiId: {
          type: String,
          get: decrypt,
          set: encrypt,
        },
        upiPhone: String,
        isDefault: Boolean,
      },
    ],
    investments: [
      {
        date: Date,
        amount: Number,
        // Maturity Tracking
        isMatured: { type: Boolean, default: false },
        lastAccrualDate: Date,
        type: { type: String },
      },
    ],
    payoutHistory: [
      {
        date: Date,
        amount: Number,
        type: { type: String }, // e.g., 'interest', 'principal'
        mode: String,
        reference: String,
        status: String,
        notes: String,
        remainingPrincipal: Number,
      },
    ],
    interestHistory: [
      {
        month: String,
        amount: Number,
        paidDate: Date,
        mode: String,
        status: String,
        products: String,
        notes: String,
        reference: String,
        saleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
      },
    ],

    unpaidInterest: { type: Number, default: 0 },
    lastAccrualDate: { type: Date }, // To track when the last monthly interest was added to unpaidInterest
    certNo: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

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
    email: {
      type: String,
      trim: true,
      lowercase: true,
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
    role: {
      type: String,
      enum: ["customer", "Investor", "Customer & investor"],
      default: "customer",
    },
    investmentDetails: [investorDetailsSchema],
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

module.exports =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
