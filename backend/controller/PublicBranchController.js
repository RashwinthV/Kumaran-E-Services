const Branch = require("../models/Branch");
const bcrypt = require("bcryptjs");

/**
 * @desc    Verify branch code and access code
 * @route   POST /api/branches/verify
 * @access  Public
 */
exports.verifyBranch = async (req, res) => {
  try {
    const { branchCode, accessCode } = req.body;

    if (!branchCode || !accessCode) {
      return res.status(400).json({
        success: false,
        message: "Please provide branch code and access code",
      });
    }

    // Find branch by code (uppercase as per schema)
    const branch = await Branch.findOne({ code: branchCode.toUpperCase() });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    if (branch.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "This branch is currently inactive",
      });
    }

    // Compare hashed AccessCode
    const isMatch = await bcrypt.compare(accessCode, branch.AccessCode);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid access code",
      });
    }

    // Send back minimal branch info
    res.status(200).json({
      success: true,
      message: "Branch verified successfully",
      branch: {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        contact: branch.contact,
        gstNumber: branch.gstNumber,
      },
    });
  } catch (error) {
    console.error("Branch verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during branch verification",
    });
  }
};
