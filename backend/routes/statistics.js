const express = require("express");
const { getStatistics } = require("../controllers/statisticsController");

const router = express.Router();

router.get("/statistics", getStatistics);

module.exports = router;
