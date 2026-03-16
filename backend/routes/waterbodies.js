const express = require("express");
const { getWaterbodies } = require("../controllers/waterbodiesController");

const router = express.Router();

router.get("/waterbodies", getWaterbodies);

module.exports = router;
