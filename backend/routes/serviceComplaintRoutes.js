const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createComplaint,
  getComplaints,
  deleteComplaint,
  getComplaintHistory,
  updateComplaintStatus,
} = require("../controller/ServiceComplaintController");

router.route("/").post(protect, createComplaint).get(protect, getComplaints);
router.route("/history").get(protect, getComplaintHistory);
router.route("/:id").delete(protect, deleteComplaint);
router.route("/:id/status").patch(protect, updateComplaintStatus);

module.exports = router;
