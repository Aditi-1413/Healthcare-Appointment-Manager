const express = require("express");

const {
  getMyMedicalRecord,
} = require("../controllers/patientController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  getMyMedicalRecord
);

module.exports = router;