const ServiceComplaint = require("../models/ServiceComplaint");
const Branch = require("../models/Branch");

// @desc    Create a new service complaint/repair ticket
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerId,
      service,
      module,
      formData,
      totalAmount,
      taxAmount,
      description,
    } = req.body;

    // Verify branch exists for the user
    // Assuming req.user is populated by auth middleware
    const branchCode = req.user.branchCode;
    const branch = await Branch.findOne({ code: branchCode });

    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    const complaint = await ServiceComplaint.create({
      branch: branch._id,
      branchCode,
      serviceId: formData?.serviceId || null,
      customerName,
      customerPhone,
      customerId,
      service,
      module,
      formData,
      totalAmount,
      taxAmount,
      description,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all pending complaints for the branch
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
  try {
    const branchCode = req.user.branchCode;
    

    const complaints = await ServiceComplaint.find({
      branchCode: branchCode,
      status: "Pending",
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete/Cancel a complaint
// @route   DELETE /api/complaints/:id
// @access  Private
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await ServiceComplaint.findById(req.params.id);

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    // Ensure user belongs to the same branch
    if (complaint.branchCode !== req.user.branchCode) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    complaint.isDeleted = true;
    complaint.status = "Cancelled";
    await complaint.save();

    res.status(200).json({
      success: true,
      data: {},
      message: "Complaint removed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get complaint history (Completed & Cancelled)
// @route   GET /api/complaints/history
// @access  Private
exports.getComplaintHistory = async (req, res) => {
  try {
    const branchCode = req.user.branchCode;

    const history = await ServiceComplaint.find({
      branchCode: branchCode,
      status: { $in: ["Completed", "Cancelled"] },
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await ServiceComplaint.findById(req.params.id);

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    if (complaint.branchCode !== req.user.branchCode) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    complaint.status = status;
    await complaint.save();

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
