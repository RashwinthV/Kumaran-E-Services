const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/emailUtils");

const otpStore = new Map();

// Generate Access Token (short-lived - 15 minutes)
const generateAccessToken = (id) => {
  return jwt.sign({ id, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

// Generate Refresh Token (long-lived - 7 days)
const generateRefreshToken = (id, tokenVersion) => {
  return jwt.sign(
    { id, type: "refresh", version: tokenVersion },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

exports.login = async (req, res) => {
  try {
    const { identifier, password, portal, branchCode } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/employee ID and password",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { employeeId: identifier.toUpperCase() },
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin.",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Role-based access control
    if (portal === "frontend") {
      // Frontend portal: only staff can login
      if (user.role !== "staff") {
        return res.status(403).json({
          success: false,
          message: "Access denied. This portal is for staff members only.",
        });
      }

      // Verify branch
      if (branchCode && user.branchCode !== branchCode.toUpperCase()) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You are not assigned to branch ${branchCode}.`,
        });
      }
    } else if (portal === "admin") {
      // Admin portal: only admin and manager can login
      if (user.role !== "admin" && user.role !== "manager") {
        return res.status(403).json({
          success: false,
          message: " Please use the staff portal.",
        });
      }
    }

    // Update last login
    user.lastLogin = Date.now();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(
      user._id,
      user.credentials.tokenVersion,
    );

    // Store refresh token in database
    user.credentials.refreshToken = refreshToken;
    user.credentials.lastTokenRefresh = Date.now();
    await user.save({ validateBeforeSave: false });

    // Set refresh token as HTTP-only cookie
    const cookieName =
      portal === "admin" ? "adminRefreshToken" : "refreshToken";
    res.cookie(cookieName, refreshToken, {
      httpOnly: true, // Cannot be accessed via JavaScript
      secure: true, // Always true for SameSite: 'none'
      sameSite: "none", // Allow cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        phone: user.phone,
        role: user.role,
        branchCode: user.branchCode,
        PayPerDay: user.PayPerDay,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { portal } = req.body;
    const cookieName =
      portal === "admin" ? "adminRefreshToken" : "refreshToken";

    // Get refresh token from HTTP-only cookie
    const refreshToken = req.cookies[cookieName];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // Get user and check if refresh token matches
    const user = await User.findById(decoded.id).select(
      "+credentials.refreshToken +credentials.tokenVersion",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account deactivated",
      });
    }

    // Check if refresh token matches stored token
    if (user.credentials.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check token version
    if (decoded.version !== user.credentials.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked",
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        phone: user.phone,
        role: user.role,
        branchCode: user.branchCode,
        PayPerDay: user.PayPerDay,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Increment token version to invalidate all existing tokens
    user.credentials.tokenVersion += 1;
    user.credentials.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    // Clear refresh token cookie
    res.clearCookie("adminRefreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;

    // Invalidate all existing tokens
    user.credentials.tokenVersion += 1;
    await user.save();

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(
      user._id,
      user.credentials.tokenVersion,
    );

    user.credentials.refreshToken = refreshToken;
    user.credentials.lastTokenRefresh = Date.now();
    await user.save({ validateBeforeSave: false });

    // Set new refresh token as HTTP-only cookie
    // Since we don't have portal in updatePassword body yet, we check which cookie was used
    const cookieName = req.cookies.adminRefreshToken
      ? "adminRefreshToken"
      : "refreshToken";
    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      accessToken,
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 3 * 60 * 1000; // 3 minutes

    otpStore.set(email.toLowerCase(), { otp, expires });

    const emailSent = await sendOTP(user.email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Error sending email. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP",
      });
    }

    const storedData = otpStore.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not requested",
      });
    }

    if (storedData.expires < Date.now()) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const storedData = otpStore.get(email.toLowerCase());

    if (
      !storedData ||
      storedData.otp !== otp ||
      storedData.expires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP session",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = newPassword;
    user.credentials.tokenVersion += 1; // Revoke old tokens
    await user.save();

    // Clear OTP from store
    otpStore.delete(email.toLowerCase());

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
