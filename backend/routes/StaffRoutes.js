const express = require("express");
const router = express.Router();
const {
  createSale,
  getSales,
  refundSale,
} = require("../controller/SalesController");
const { createServiceSale } = require("../controller/ServiceBillingController");
const {
  getMyBranchAccounts,
  closeAccount,
} = require("../controller/AccountController");
const {
  createExpense,
  getExpenses,
  getEmployeeExpenseSummary,
} = require("../controller/ExpenseController");
const {
  getMyBranchCustomers,
  getBranchInvestors,
  upsertCustomer,
  searchByPhone,
  settleCustomerCredit,
  getCustomerPaymentHistory,
  checkMaturity,
  closeInvestment,
  processPrincipalTransaction,
  deleteInvestorInvestment,
} = require("../controller/CustomerController");
const {
  getInventoryByBranchStaff,
} = require("../controller/InventoryController");
const { GetEmployee } = require("../controller/EmployeeController");
const { protect } = require("../middleware/auth");
const {
  getBranchBycode,
  getBranchPrintInfo,
} = require("../controller/BranchController");
const { GetProdctBYBranch } = require("../controller/ProductController");
const { getAllCategories } = require("../controller/CategoryController");

// Sales routes
router.post("/", protect, createSale);
router.post("/services", protect, createServiceSale);
router.get("/", protect, getSales);
router.post("/refund", protect, refundSale);

// Expense routes
router.post("/expenses", protect, createExpense);
router.get("/expenses", protect, getExpenses);
router.get(
  "/expenses/employee/:name/summary",
  protect,
  getEmployeeExpenseSummary,
);

// Inventory routes for staff
router.get("/inventory/my-branch", protect, getInventoryByBranchStaff);

// Account routes for staff
router.get("/accounts/my-branch", protect, getMyBranchAccounts);
router.post("/accounts/:id/close", protect, closeAccount);

// Customer routes for staff
router.get("/customers/my-branch", protect, getMyBranchCustomers);
router.get("/customers/investors/my-branch", protect, getBranchInvestors);
router.post("/customers", protect, upsertCustomer);
router.post("/customers/transaction", protect, processPrincipalTransaction);
router.post("/customers/check-maturity", protect, checkMaturity);
router.post(
  "/customers/:customerId/investment/:investmentId/close",
  protect,
  closeInvestment,
);
router.delete(
  "/customers/:customerId/investment/:investmentId",
  protect,
  deleteInvestorInvestment,
);
router.get("/customers/search/:phone", protect, searchByPhone);
router.post(
  "/customers/:customerId/settle-credit",
  protect,
  settleCustomerCredit,
);
router.get(
  "/customers/:customerId/payment-history",
  protect,
  getCustomerPaymentHistory,
);

//get brabch products
router.get("/products/:BranchId", protect, GetProdctBYBranch);

//branch route
router.get("/Branch/:branchcode", protect, getBranchBycode);
router.get("/my-branch-print-info", protect, getBranchPrintInfo);
router.get("/employees/:branchcode", protect, GetEmployee);
router.get("/categories", protect, getAllCategories);

module.exports = router;
