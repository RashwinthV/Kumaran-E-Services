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
    status: { type: String, enum: ["active", "inactive"], default: "active" },
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
        type: { type: String }, // e.g., 'initial', 'additional'
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
      },
    ],
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
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
    investorDetails: investorDetailsSchema,
    credits: [creditItemSchema],
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

module.exports =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);
