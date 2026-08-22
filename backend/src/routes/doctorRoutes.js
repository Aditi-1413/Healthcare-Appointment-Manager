const express = require("express");

const {
  createDoctor,
  getDoctors, 
  getAvailableSlots,
} = require("../controllers/doctorController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/",getDoctors);
router.get("/:doctorId/slots", getAvailableSlots);


router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createDoctor
);

module.exports = router;