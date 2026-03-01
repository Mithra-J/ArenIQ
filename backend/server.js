const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "YOUR_FIREBASE_DB_URL"
});

const db = admin.database();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/report", async (req, res) => {
  const { description, lat, lng, imageUrl } = req.body;

  await db.ref("reports").push({
    description,
    lat,
    lng,
    imageUrl,
    status: "Pending",
    createdAt: Date.now()
  });

  res.send({ message: "Report Submitted" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});