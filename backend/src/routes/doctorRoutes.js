const express = require("express");

const {
  createDoctor,
  getDoctors, 
} = require("../controllers/doctorController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/",getDoctors);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createDoctor
);

module.exports = router;