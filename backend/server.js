require("dotenv").config();
const cors = require("cors");
const express = require("express");

const reportsRouter = require("./routes/reports");
const statisticsRouter = require("./routes/statistics");
const uploadRouter = require("./routes/upload");
const waterbodiesRouter = require("./routes/waterbodies");
const satelliteRouter = require("./routes/satellite");
const weatherRouter = require("./routes/weather");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { startEscalationScheduler } = require("./escalation");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ArenIQ backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", reportsRouter);
app.use("/api", waterbodiesRouter);
app.use("/api", uploadRouter);
app.use("/api", statisticsRouter);
app.use("/api", satelliteRouter);
app.use("/api", weatherRouter);

app.use((error, _req, res, _next) => {
  console.error("[backend:error]", error);
  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
  });
});


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests – please try again later" }
});
app.use(limiter);

// START ESCALATION ENGINE
startEscalationScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[ArenIQ] Backend listening on http://localhost:${PORT}`);
  console.log(`[✓] Escalation scheduler running (every hour)`);
  console.log(`[✓] Helmet + Rate limiting enabled (production mode)`);
});


app.listen(PORT, () => {
  console.log(`[ArenIQ] Backend listening on http://localhost:${PORT}`);
});
