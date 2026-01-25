const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    AccessCode: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    contact: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    OwnerShip: {
      type: String,
      enum: ["Owned", "Leased", "Rented"],
      default: "Owned",
    },
    leasedetails: {
      leaseholdername: { type: String, trim: true },
      leaseholdercontact: { type: String, trim: true },
      leaseholderemail: { type: String, trim: true },
      leaseholderaddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        pincode: { type: String, trim: true },
      },
      Leasedamount: { type: String, trim: true },
      LeasedFrequency: {
        type: String,
        trim: true,
        enum: ["Monthly", "Quarterly", "Yearly", "One Time"],
        default: "Monthly",
      },
      LeasedPeriod: {
        LeasedStartDate: { type: String, trim: true },
        LeasedEndDate: { type: String, trim: true },
      },
    },
    rentdetails: {
      rentamount: { type: String, trim: true },
      rentfrequency: {
        type: String,
        trim: true,
        enum: ["Monthly", "Quarterly", "Yearly"],
        default: "Monthly",
      },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    lastBillNumber: {
      type: Number,
      default:1, // Starts from 1001
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Branch || mongoose.model("Branch", branchSchema);
