const express = require("express");

const {
  createDoctor,
} = require("../controllers/doctorController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createDoctor
);

module.exports = router;