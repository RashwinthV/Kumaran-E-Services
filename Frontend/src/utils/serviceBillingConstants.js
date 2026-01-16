export const SERVICE_MODULES = {
  UTILITY: {
    label: "Utility Bills",
    icon: "bi-lightning-charge",
    services: [
      "Electricity",
      "Water",
      "Gas/LPG",
      "Broadband",
      // "Cable TV",
    ],
  },
  // MOBILE_TV: {
  //   label: "Mobile & TV",
  //   icon: "bi-phone",
  //   services: [
  //     // "Mobile Prepaid",
  //     // "Mobile Postpaid",
  //     "DTH Recharge",
  //     "Data Card",
  //     "OTT Subscription",
  //     "Music App",
  //   ],
  // },
  FINANCIAL: {
    label: "Financial",
    icon: "bi-bank",
    services: [
      "Credit Card Bill",
      "Loan EMI",
      "Insurance Premium",
      "NBFC Payment",
      "Fund Transfer",
    ],
  },
  GOVT: {
    label: "Government",
    icon: "bi-building",
    services: [
      "Traffic Challan",
      "Passport Fees",
      "Exam Fees",
      "Police Verification",
    ],
  },
  AADHAR: {
    label: "Aadhar Services",
    icon: "bi-fingerprint",
    services: [
      "Aadhar ATM",
      "Update Aadhar",
      "Order PVC Card",
      "Download Aadhar",
      // "Bio-Metric Unlock",
      "Link PAN-Aadhar",
    ],
  },
  EDUCATION: {
    label: "Education",
    icon: "bi-mortarboard",
    services: [
      "School Fees",
      "College Fees",
      "Online Exam Fees",
      "Coaching Fees",
    ],
  },
  TRAVEL: {
    label: "Travel & Transport",
    icon: "bi-bus-front",
    services: [
      "Train Ticket",
      "Bus Ticket",
      "Flight Ticket",
      "FASTag Recharge",
    ],
  },
  LOCAL: {
    label: "Local Services",
    icon: "bi-shop",
    services: ["Xerox","Printout", "Scan", "Photograph", "Lamination"],
  },
};

export const getCurrencySymbol = (settingValue) => {
  if (!settingValue) return "₹";
  const match = settingValue.match(/\(([^)]+)\)/);
  return match ? match[1] : settingValue;
};

// Configuration for input fields based on specific service
// keys: corresponding to 'services' strings above.
// fields: consumerId (label), providerName (label), etc.
// If a field label is null/false, the field is hidden.
export const SERVICE_FIELDS_CONFIG = {
  // --- UTILITY ---
  Electricity: {
    consumerId: "Consumer Number",
    providerName: "Electricity Board",
    planDetails: "Bill Period / Month",
    showName: false,
  },
  Water: {
    consumerId: "Connection ID / Consumer No",
    providerName: "Water Board",
    planDetails: "Bill Period",
    showName: true,
  },
  "Gas/LPG": {
    consumerId: "LPG ID / Mobile No",
    providerName: "Distributor / Agency",
    planDetails: "Booking Reference",
    showName: true,
  },
  Landline: {
    consumerId: "Landline Number (with Code)",
    providerName: "Operator (BSNL/Airtel)",
    planDetails: "Bill Date / Period",
    showName: true,
  },
  Broadband: {
    consumerId: "User ID / Account No",
    providerName: "ISP Name",
    planDetails: "Plan Name",
    showName: true,
  },

  // --- MOBILE & TV ---
  "Mobile Prepaid": {
    consumerId: "Mobile Number",
    providerName: "Operator & Circle",
    planDetails: "Plan Description",
    showName: false,
  },
  "Mobile Postpaid": {
    consumerId: "Mobile Number",
    providerName: "Operator",
    planDetails: "Bill Date",
    showName: true,
  },
  "DTH Recharge": {
    consumerId: "Subscriber ID / Customer ID",
    providerName: "DTH Operator",
    planDetails: false, // Don't typically need plan for simple topup unless specific
    showName: false,
  },
  "Data Card": {
    consumerId: "Data Card Number",
    providerName: "Operator",
    showName: false,
  },
  "OTT Subscription": {
    consumerId: "User ID",
    providerName: "Platform",
    showName: false,
  },
  "Music App": {
    consumerId: "User ID",
    providerName: "Platform",
    planDetails: "planDetails",
    showName: false,
  },

  // --- FINANCIAL ---
  "Credit Card Bill": {
    consumerId: "Last 4 Digits / Card No",
    providerName: "Bank Name",
    showName: true,
    labelName: "Card Holder Name",
  },
  "Loan EMI": {
    consumerId: "Loan Account Number",
    providerName: "Lender / Bank",
    showName: true,
    labelName: "Borrower Name",
  },
  "Insurance Premium": {
    consumerId: "Policy Number",
    providerName: "Insurer",
    planDetails: "Premium Due Date",
    showName: true,
    labelName: "Policy Holder",
  },
  "Fund Transfer": {
    consumerId: "Account Number / UPI ID",
    providerName: "Bank / Service Provider",
    showName: true,
    labelName: "Beneficiary Name",
  },

  // --- GOVT ---
  "Aadhar ATM": {
    consumerId: "Aadhar Number",
    providerName: "Bank Name",
    showName: true,
    labelName: "Customer Name",
    planDetails: "Transaction Type",
  },
  "Update Aadhar": {
    consumerId: "Aadhar Number",
    providerName: "Update details(Mob/Addr)",
    showName: true,
    labelName: "Name on Aadhar",
  },
  "Order PVC Card": {
    consumerId: "Aadhar Number",
    providerName: "Mobile Number",
    showName: true,
    labelName: "Name on Aadhar",
  },
  "Download Aadhar": {
    consumerId: "Aadhar Number",
    providerName: false,
    showName: true,
    labelName: "Name on Aadhar",
  },
  "Bio-Metric Unlock": {
    consumerId: "Aadhar Number",
    providerName: false,
    showName: true,
    labelName: "Name on Aadhar",
  },
  "Link PAN-Aadhar": {
    consumerId: "Aadhar Number",
    providerName: "PAN Number",
    showName: true,
    labelName: "Name as per PAN",
  },

  // // --- LOCAL ---
  // "House Maintenance": {
  //   consumerId: false,
  //   providerName: false,
  //   description: "Details (Month/Year)",
  //   showName: true,
  //   labelName: "Tenant/Owner Name",
  // },
  // "Shop Rent": {
  //   consumerId: "Shop No",
  //   providerName: false,
  //   description: "Rent Month",
  //   showName: true,
  //   labelName: "Payer Name",
  // },
};
