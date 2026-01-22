const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      password,
      role,
      branchCode,
      branchId,
      PayPerDay,
    } = req.body;

    if (!name || !email || !phone || !age || !password || !branchCode) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
        });
      }
    }

    const user = await User.create({
      name,
      email,
      phone,
      age,
      password,
      role: role || "staff",
      branchCode,
      PayPerDay,
    });

    res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      employee: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        phone: user.phone,
        age: user.age,
        role: user.role,
        branchCode: user.branchCode,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

exports.GetEmployee = async (req, res) => {
  try {
    const { branchcode } = req.params;

    if (!branchcode) {
      return res.status(400).json({
        success: false,
        message: "Branch Code is required",
      });
    }

    const employees = await User.find({ branchCode: branchcode });

    // Return success with empty array if no employees found, frontend handles it.
    // Or we can return existing format if preferred, but success:true is better for empty lists.

    return res.status(200).json({
      success: true,
      employees: employees || [],
    });
  } catch (error) {
    console.error("Get Employees error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during fetching employees",
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during deletion",
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, age, role, PayPerDay, password } = req.body;

    let employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check for email uniqueness if changed
    if (email && email !== employee.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    // Check for phone uniqueness if changed
    if (phone && phone !== employee.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
        });
      }
    }

    // Update fields
    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.phone = phone || employee.phone;
    employee.age = age || employee.age;
    employee.role = role || employee.role;
    employee.PayPerDay = PayPerDay || employee.PayPerDay;

    // Only update password if provided
    if (password) {
      employee.password = password;
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during update",
    });
  }
};
