const express = require("express");
const { createReport, getReports, acknowledgeReport, resolveReport } = require("../controllers/reportsController");
const { requireOfficer } = require("../middleware/auth");   // ← protection

const router = express.Router();

router.get("/reports", getReports);
router.post("/report", createReport);

// Officer-only actions (protected)
router.put("/reports/:id/acknowledge", requireOfficer, acknowledgeReport);
router.put("/reports/:id/resolve",     requireOfficer, resolveReport);

module.exports = router;