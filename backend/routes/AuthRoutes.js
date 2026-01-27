const express = require("express");
const router = express.Router();
const {
  login,
  refreshToken,
  logout,
  getMe,
  updatePassword,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controller/AuthController");
const { verifyBranch } = require("../controller/PublicBranchController");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", (req, res) => {
  res.send("Backend is running");
});

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/branches/verify", verifyBranch);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/updatepassword", protect, updatePassword);
router.put("/updateprofile", protect, updateProfile);

module.exports = router;
