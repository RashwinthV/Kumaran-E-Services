// const Branch = require("../models/Branch");

// // @desc    Get all branches
// // @route   GET /admin/branches
// // @access  Private (Admin/Manager)
// exports.getAllBranches = async (req, res) => {
//   try {
//     const branches = await Branch.find().sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: branches.length,
//       data: branches,
//     });
//   } catch (error) {
//     console.error("Get branches error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching branches",
//     });
//   }
// };

// // @desc    Get single branch by ID
// // @route   GET /admin/branches/:id
// // @access  Private (Admin/Manager)
// exports.getBranchById = async (req, res) => {
//   try {
//     const { branchId } = req.params;

//     const branch = await Branch.findById({ _id: branchId });

//     if (!branch) {
//       return res.status(404).json({
//         success: false,
//         message: "Branch not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: branch,
//     });
//   } catch (error) {
//     console.error("Get branch error:", error);

//     if (error.kind === "ObjectId") {
//       return res.status(404).json({
//         success: false,
//         message: "Branch not found",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching branch",
//     });
//   }
// };

// // Helper to validate AccessCode
// const validateAccessCode = (AccessCode) => {
//   const hasUpperCase = /[A-Z]/.test(AccessCode);
//   const hasLowerCase = /[a-z]/.test(AccessCode);
//   const hasNumber = /\d/.test(AccessCode);
//   // Basic special char check
//   const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(AccessCode);

//   if (!hasUpperCase)
//     return "AccessCode must contain at least one uppercase letter";
//   if (!hasLowerCase)
//     return "AccessCode must contain at least one lowercase letter";
//   if (!hasNumber) return "AccessCode must contain at least one number";
//   if (!hasSpecialChar)
//     return "AccessCode must contain at least one special character";
//   return null;
// };

// // @desc    Create new branch
// // @route   POST /admin/branches
// // @access  Private (Admin only)
// exports.createBranch = async (req, res) => {
//   try {
//     const { name, code, address, contact, gstNumber, status, AccessCode } =
//       req.body;

//     // Validate required fields
//     if (!name || !code || !contact?.phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide name, code, and phone number",
//       });
//     }

//     // Validate AccessCode if provided
//     if (AccessCode) {
//       const AccessCodeError = validateAccessCode(AccessCode);
//       if (AccessCodeError) {
//         return res.status(400).json({
//           success: false,
//           message: AccessCodeError,
//         });
//       }
//     }

//     // Check if branch code already exists
//     const existingBranch = await Branch.findOne({ code: code.toUpperCase() });
//     if (existingBranch) {
//       return res.status(400).json({
//         success: false,
//         message: "Branch code already exists",
//       });
//     }

//     const branch = await Branch.create({
//       name,
//       code,
//       address,
//       contact,
//       gstNumber,
//       status: status || "Active",
//       AccessCode, // Save AccessCode (plain text as per current schema/request)
//     });

//     res.status(201).json({
//       success: true,
//       message: "Branch created successfully",
//       data: branch,
//     });
//   } catch (error) {
//     console.error("Create branch error:", error);

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({
//         success: false,
//         message: messages[0],
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Branch code already exists",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error while creating branch",
//     });
//   }
// };

// // @desc    Update branch
// // @route   PUT /admin/branches/:id
// // @access  Private (Admin only)
// exports.updateBranch = async (req, res) => {
//   try {
//     const { name, code, address, contact, gstNumber, status, AccessCode } =
//       req.body;

//     let branch = await Branch.findById(req.params.id);

//     if (!branch) {
//       return res.status(404).json({
//         success: false,
//         message: "Branch not found",
//       });
//     }

//     // If code is being changed, check if new code already exists
//     if (code && code.toUpperCase() !== branch.code) {
//       const existingBranch = await Branch.findOne({
//         code: code.toUpperCase(),
//         _id: { $ne: req.params.id },
//       });

//       if (existingBranch) {
//         return res.status(400).json({
//           success: false,
//           message: "Branch code already exists",
//         });
//       }
//     }

//     // Update AccessCode if provided
//     if (AccessCode && AccessCode.trim() !== "") {
//       const AccessCodeError = validateAccessCode(AccessCode);
//       if (AccessCodeError) {
//         return res.status(400).json({
//           success: false,
//           message: AccessCodeError,
//         });
//       }
//       branch.AccessCode = AccessCode;
//     }

//     // Update fields
//     branch.name = name || branch.name;
//     branch.code = code || branch.code;
//     branch.address = address || branch.address;
//     branch.contact = contact || branch.contact;
//     branch.gstNumber = gstNumber !== undefined ? gstNumber : branch.gstNumber;
//     branch.status = status || branch.status;

//     await branch.save();

//     res.status(200).json({
//       success: true,
//       message: "Branch updated successfully",
//       data: branch,
//     });
//   } catch (error) {
//     console.error("Update branch error:", error);

//     if (error.kind === "ObjectId") {
//       return res.status(404).json({
//         success: false,
//         message: "Branch not found",
//       });
//     }

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({
//         success: false,
//         message: messages[0],
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Branch code already exists",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error while updating branch",
//     });
//   }
// };

// // @desc    Delete branch
// // @route   DELETE /admin/branches/:id
// // @access  Private (Admin only)
// exports.deleteBranch = async (req, res) => {
//   try {
//     const branch = await Branch.findById(req.params.id);

//     if (!branch) {
//       return res.status(404).json({
//         success: false,
//         message: "Branch not found",
//       });
//     }

//     // TODO: Add check if branch has employees before deleting
//     // const User = require("../models/user");
//     // const employeeCount = await User.countDocuments({ branchCode: branch.code });
//     // if (employeeCount > 0) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: `Cannot delete branch. ${employeeCount} employee(s) are assigned to this branch.`,
//     //   });
//     // }

//     await branch.deleteOne();

//     res.status(200).json({
//       success: true,
//       message: "Branch deleted successfully",
//       data: {},
//     });
//   } catch (error) {
//     console.error("Delete branch error:", error);

//     if (error.kind === "ObjectId") {
//       return res.status(404).json({
//         success: false,
//         message: "Branch not found",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error while deleting branch",
//     });
//   }
// };

// // @desc    Get branch statistics
// // @route   GET /admin/branches/stats
// // @access  Private (Admin/Manager)
// exports.getBranchStats = async (req, res) => {
//   try {
//     const totalBranches = await Branch.countDocuments();
//     const activeBranches = await Branch.countDocuments({ status: "Active" });
//     const inactiveBranches = await Branch.countDocuments({
//       status: "Inactive",
//     });

//     res.status(200).json({
//       success: true,
//       data: {
//         total: totalBranches,
//         active: activeBranches,
//         inactive: inactiveBranches,
//       },
//     });
//   } catch (error) {
//     console.error("Get branch stats error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching branch statistics",
//     });
//   }
// };

const Branch = require("../models/Branch");
const bcrypt = require("bcryptjs");

// ------------------------------------------------------
// Helper: Validate AccessCode Format
// ------------------------------------------------------
const validateAccessCode = (AccessCode) => {
  const hasUpperCase = /[A-Z]/.test(AccessCode);
  const hasLowerCase = /[a-z]/.test(AccessCode);
  const hasNumber = /\d/.test(AccessCode);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
    AccessCode,
  );

  if (!hasUpperCase)
    return "AccessCode must contain at least one uppercase letter";

  if (!hasLowerCase)
    return "AccessCode must contain at least one lowercase letter";

  if (!hasNumber) return "AccessCode must contain at least one number";

  if (!hasSpecialChar)
    return "AccessCode must contain at least one special character";

  return null;
};

// ------------------------------------------------------
// @desc    Get all branches
// @route   GET /admin/branches
// @access  Private
// ------------------------------------------------------
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching branches",
    });
  }
};

// ------------------------------------------------------
// @desc    Get branch by ID
// @route   GET /admin/branches/:id
// @access  Private
// ------------------------------------------------------
exports.getBranchById = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await Branch.findById({ _id: branchId });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    console.error("Get branch error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching branch",
    });
  }
};

// ------------------------------------------------------
// @desc    Create new branch
// @route   POST /admin/branches
// @access  Private (Admin)
// ------------------------------------------------------
exports.createBranch = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      contact,
      gstNumber,
      status,
      AccessCode,
      OwnerShip,
      leasedetails,
      rentdetails,
    } = req.body;

    if (!name || !code || !contact?.phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, code, and phone number",
      });
    }

    // Validate AccessCode → Hash AccessCode
    let hashedAccessCode = null;

    if (AccessCode) {
      const AccessCodeError = validateAccessCode(AccessCode);
      if (AccessCodeError) {
        return res.status(400).json({
          success: false,
          message: AccessCodeError,
        });
      }

      const salt = await bcrypt.genSalt(10);
      hashedAccessCode = await bcrypt.hash(AccessCode, salt);
    }

    // Check duplicate code
    const existingBranch = await Branch.findOne({ code: code.toUpperCase() });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Branch code already exists",
      });
    }

    // Create branch
    const branch = await Branch.create({
      name,
      code,
      address,
      contact,
      gstNumber,
      status: status || "Active",
      AccessCode: hashedAccessCode,
      OwnerShip,
      leasedetails: OwnerShip === "Leased" ? leasedetails : undefined,
      rentdetails: OwnerShip === "Rented" ? rentdetails : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    console.error("Create branch error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Branch code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating branch",
    });
  }
};

// ------------------------------------------------------
// @desc    Update branch
// @route   PUT /admin/branches/:id
// @access  Private (Admin)
// ------------------------------------------------------
exports.updateBranch = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      contact,
      gstNumber,
      status,
      AccessCode,
      OwnerShip,
      leasedetails,
      rentdetails,
    } = req.body;

    let branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // Check if branch code is new & unique
    if (code && code.toUpperCase() !== branch.code) {
      const existingBranch = await Branch.findOne({
        code: code.toUpperCase(),
        _id: { $ne: req.params.id },
      });

      if (existingBranch) {
        return res.status(400).json({
          success: false,
          message: "Branch code already exists",
        });
      }
    }

    // If updating AccessCode → validate → hash
    if (AccessCode && AccessCode.trim() !== "") {
      const AccessCodeError = validateAccessCode(AccessCode);
      if (AccessCodeError) {
        return res.status(400).json({
          success: false,
          message: AccessCodeError,
        });
      }

      const salt = await bcrypt.genSalt(10);
      branch.AccessCode = await bcrypt.hash(AccessCode, salt);
    }

    // Update fields
    branch.name = name || branch.name;
    branch.code = code || branch.code;
    branch.address = address || branch.address;
    branch.contact = contact || branch.contact;
    branch.gstNumber = gstNumber !== undefined ? gstNumber : branch.gstNumber;
    branch.status = status || branch.status;
    branch.OwnerShip = OwnerShip || branch.OwnerShip;

    if (branch.OwnerShip === "Leased") {
      branch.leasedetails = leasedetails || branch.leasedetails;
      branch.rentdetails = undefined; // Clear rent details if switching to lease
    } else if (branch.OwnerShip === "Rented") {
      branch.rentdetails = rentdetails || branch.rentdetails;
      branch.leasedetails = undefined; // Clear lease details if switching to rent
    } else {
      // Owned or other
      branch.leasedetails = undefined;
      branch.rentdetails = undefined;
    }

    await branch.save();

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
  } catch (error) {
    console.error("Update branch error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Branch code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating branch",
    });
  }
};

// ------------------------------------------------------
// @desc    Delete branch
// @route   DELETE /admin/branches/:id
// @access  Private (Admin)
// ------------------------------------------------------
exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    await branch.deleteOne();

    res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete branch error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting branch",
    });
  }
};

// ------------------------------------------------------
// @desc    Branch statistics
// @route   GET /admin/branches/stats
// @access  Private
// ------------------------------------------------------
exports.getBranchStats = async (req, res) => {
  try {
    const totalBranches = await Branch.countDocuments();
    const activeBranches = await Branch.countDocuments({ status: "Active" });
    const inactiveBranches = await Branch.countDocuments({
      status: "Inactive",
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalBranches,
        active: activeBranches,
        inactive: inactiveBranches,
      },
    });
  } catch (error) {
    console.error("Get branch stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching branch statistics",
    });
  }
};

//<--------------------STAFF<-------------->//

exports.getBranchBycode = async (req, res) => {
  try {
    const { branchcode } = req.params;

    const branch = await Branch.findOne({ code: branchcode }).select(
      "-password -AccessCode -contact -address",
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(200).json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error("Get branch error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching branch",
    });
  }
};
// @desc    Get current staff's branch details for printing
// @route   GET /api/staff/my-branch-print-info
// @access  Private
exports.getBranchPrintInfo = async (req, res) => {
  try {
    // Branch code is attached to the user by the protect middleware
    const branchCode = req.user.branchCode;

    if (!branchCode) {
      return res.status(400).json({
        success: false,
        message: "No branch code associated with user",
      });
    }

    const branch = await Branch.findOne({ code: branchCode }).select(
      "name code address contact gstNumber",
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch information not found",
      });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    console.error("Get branch print info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching branch information",
    });
  }
};
