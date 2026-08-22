const express = require("express");

const {
  addDoctorLeave,
} = require("../controllers/leaveController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/doctors/:doctorId/leaves",
  authenticate,
  authorize("ADMIN"),
  addDoctorLeave
);

module.exports = router;