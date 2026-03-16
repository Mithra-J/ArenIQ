const express = require("express");
const { getSatellitePreview } = require("../controllers/satelliteController");

const router = express.Router();

router.get("/satellite/preview", getSatellitePreview);

module.exports = router;
