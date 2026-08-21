const express = require("express");

const {
  registerPatient,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerPatient);

module.exports = router;