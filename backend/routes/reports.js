const express = require("express");
const { createReport, getReports } = require("../controllers/reportsController");

const router = express.Router();

router.get("/reports", getReports);
router.post("/report", createReport);

module.exports = router;
