async function getWeatherContext(req, res, next) {
  try {
    const { latitude, longitude } = req.query;

    if (!process.env.OPENWEATHER_API_KEY) {
      return res.json(null);
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("lat", latitude);
    url.searchParams.set("lon", longitude);
    url.searchParams.set("appid", process.env.OPENWEATHER_API_KEY);
    url.searchParams.set("units", "metric");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather request failed with status ${response.status}`);
    }

    res.json(await response.json());
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWeatherContext,
};
