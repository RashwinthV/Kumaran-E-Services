const express = require("express");
const router = express.Router();
const {
  createSale,
  getSales,
  refundSale,
} = require("../controller/SalesController");
const {
  getMyBranchAccounts,
  closeAccount,
} = require("../controller/AccountController");
const {
  getMyBranchCustomers,
  upsertCustomer,
  searchByPhone,
  settleCustomerCredit,
  getCustomerPaymentHistory,
} = require("../controller/CustomerController");
const {
  getInventoryByBranchStaff,
} = require("../controller/InventoryController");
const { protect } = require("../middleware/auth");
const { getBranchBycode } = require("../controller/BranchController");
const { GetProdctBYBranch } = require("../controller/ProductController");
const { getAllCategories } = require("../controller/CategoryController");

// Sales routes
router.post("/", protect, createSale);
router.get("/", protect, getSales);
router.post("/refund", protect, refundSale);

// Inventory routes for staff
router.get("/inventory/my-branch", protect, getInventoryByBranchStaff);

// Account routes for staff
router.get("/accounts/my-branch", protect, getMyBranchAccounts);
router.post("/accounts/:id/close", protect, closeAccount);

// Customer routes for staff
router.get("/customers/my-branch", protect, getMyBranchCustomers);
router.post("/customers", protect, upsertCustomer);
router.get("/customers/search/:phone", protect, searchByPhone);
router.post(
  "/customers/:customerId/settle-credit",
  protect,
  settleCustomerCredit
);
router.get(
  "/customers/:customerId/payment-history",
  protect,
  getCustomerPaymentHistory
);

//get brabch products
router.get("/products/:BranchId", protect, GetProdctBYBranch);

//branch route
router.get("/Branch/:branchcode", protect, getBranchBycode);
router.get("/categories", protect, getAllCategories);

module.exports = router;
