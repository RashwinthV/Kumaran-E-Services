const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  register,
  GetEmployee,
  deleteEmployee,
  updateEmployee,
} = require("../controller/EmployeeController");
const {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStats,
  getBranchById,
} = require("../controller/BranchController");
const {
  getAllAccounts,
  getAccountsByBranch,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  addBalanceHistory,
} = require("../controller/AccountController");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controller/ProductController");
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/CategoryController");
const {
  getAllSubCategories,
  getSubCategoriesByCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../controller/SubCategoryController");

// Public routes
router.get("/", (req, res) => {
  res.send("Backend is running");
});

// Protected routes - dashboard
router.get(
  "/dashboard/stats",
  protect,
  authorize("admin", "manager"),
  require("../controller/DashboardController").getDashboardStats,
);

// Protected routes - Employee Management
router.post(
  "/registeremployee/:id",
  protect,
  authorize("admin", "manager"),
  register,
);

// Protected routes - Branch Management
router.get(
  "/branches/stats",
  protect,
  authorize("admin", "manager"),
  getBranchStats,
);
router.get("/branches", protect, authorize("admin", "manager"), getAllBranches);
router.get(
  "/:id/branches/:branchId",
  protect,
  authorize("admin", "manager"),
  getBranchById,
);
router.post("/branches", protect, authorize("admin"), createBranch);
router.put("/branches/:id", protect, authorize("admin"), updateBranch);
router.delete("/branches/:id", protect, authorize("admin"), deleteBranch);

router.get(
  "/:id/employees/:branchcode",
  protect,
  authorize("admin"),
  GetEmployee,
);
router.delete("/employees/:id", protect, authorize("admin"), deleteEmployee);
router.put(
  "/employees/:id",
  protect,
  authorize("admin", "manager"),
  updateEmployee,
);

// Protected routes - Account Management
router.get("/accounts", protect, authorize("admin", "manager"), getAllAccounts);
router.get(
  "/accounts/branch/:branchId",
  protect,
  authorize("admin", "manager"),
  getAccountsByBranch,
);
router.get(
  "/accounts/:id",
  protect,
  authorize("admin", "manager"),
  getAccountById,
);
router.post("/accounts", protect, authorize("admin"), createAccount);
router.put("/accounts/:id", protect, authorize("admin"), updateAccount);
router.delete("/accounts/:id", protect, authorize("admin"), deleteAccount);
router.post(
  "/accounts/:id/balance",
  protect,
  authorize("admin", "manager"),
  addBalanceHistory,
);
router.post(
  "/accounts/:id/close",
  protect,
  authorize("admin", "manager", "staff"),
  require("../controller/AccountController").closeAccount,
);

// Protected routes - Product Management
router.get("/products", protect, authorize("admin", "manager"), getAllProducts);
router.get(
  "/products/:id",
  protect,
  authorize("admin", "manager"),
  getProductById,
);

// Protected routes - Sales and Reports
router.get(
  "/expenses",
  protect,
  authorize("admin", "manager"),
  require("../controller/ExpenseController").getExpenses,
);
router.get(
  "/sales",
  protect,
  authorize("admin", "manager"),
  require("../controller/SalesController").getSales,
);
router.post("/products", protect, authorize("admin"), createProduct);
router.put("/products/:id", protect, authorize("admin"), updateProduct);
router.delete("/products/:id", protect, authorize("admin"), deleteProduct);

// Protected routes - Categories & SubCategories
router.get(
  "/categories",
  protect,
  authorize("admin", "manager"),
  getAllCategories,
);
router.post("/categories", protect, authorize("admin"), createCategory);
router.put("/categories/:id", protect, authorize("admin"), updateCategory);
router.delete("/categories/:id", protect, authorize("admin"), deleteCategory);

router.get(
  "/subcategories",
  protect,
  authorize("admin", "manager"),
  getAllSubCategories,
);
router.get(
  "/subcategories/category/:categoryId",
  protect,
  authorize("admin", "manager"),
  getSubCategoriesByCategory,
);
router.post("/subcategories", protect, authorize("admin"), createSubCategory);
router.put(
  "/subcategories/:id",
  protect,
  authorize("admin"),
  updateSubCategory,
);
router.delete(
  "/subcategories/:id",
  protect,
  authorize("admin"),
  deleteSubCategory,
);

const {
  addInventory,
  getInventoryByBranch,
  updateInventory,
  deleteInventory,
} = require("../controller/InventoryController");

const {
  upsertCustomer,
  settleCustomerCredit,
  checkMaturity,
  closeInvestment,
  processPrincipalTransaction,
  deleteInvestorInvestment,
  getAllCustomers,
  getAllBranchInvestors,
} = require("../controller/CustomerController");

// Protected routes - Inventory Management
router.post("/inventory", protect, authorize("admin"), addInventory);
router.get(
  "/inventory/:branchId",
  protect,
  authorize("admin", "manager"),
  getInventoryByBranch,
);
router.put("/inventory/:id", protect, authorize("admin"), updateInventory);
router.delete("/inventory/:id", protect, authorize("admin"), deleteInventory);

// Protected routes - Customer & Investor Management
router.get(
  "/customers",
  protect,
  authorize("admin", "manager"),
  getAllCustomers,
);
router.post(
  "/customers",
  protect,
  authorize("admin", "manager"),
  upsertCustomer,
);
router.put(
  "/customers/:id",
  protect,
  authorize("admin", "manager"),
  upsertCustomer,
);
router.post(
  "/customers/:customerId/settle",
  protect,
  authorize("admin", "manager"),
  settleCustomerCredit,
);

router.get(
  "/investors",
  protect,
  authorize("admin", "manager"),
  getAllBranchInvestors,
); // Note: Make sure getBranchInvestors can handle 'all' or admin context if needed, or create getAllInvestors
router.post(
  "/investors/transaction",
  protect,
  authorize("admin", "manager"),
  processPrincipalTransaction,
);
router.post(
  "/investors/check-maturity",
  protect,
  authorize("admin", "manager"),
  checkMaturity,
);
router.post(
  "/investors/:customerId/close/:investmentId",
  protect,
  authorize("admin"),
  closeInvestment,
);
router.delete(
  "/investors/:customerId/investment/:investmentId",
  protect,
  authorize("admin"),
  deleteInvestorInvestment,
);

module.exports = router;
