const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createComplaint,
  getComplaints,
  deleteComplaint,
} = require("../controller/ServiceComplaintController");

router.route("/").post(protect, createComplaint).get(protect, getComplaints);
router.route("/:id").delete(protect, deleteComplaint);

module.exports = router;
