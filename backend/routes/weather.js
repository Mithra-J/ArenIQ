const express = require("express");
const { getWeatherContext } = require("../controllers/weatherController");

const router = express.Router();

router.get("/weather-context", getWeatherContext);

module.exports = router;
