import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
});

export async function fetchReports() {
  const { data } = await api.get("/reports");
  return data;
}

export async function submitEncroachmentReport(payload) {
  const { data } = await api.post("/report", payload);
  return data;
}

export async function fetchWaterbodies() {
  const { data } = await api.get("/waterbodies");
  return data;
}

export async function fetchStatistics() {
  const { data } = await api.get("/statistics");
  return data;
}

export async function uploadPhoto({ file, folder = "reports" }) {
  if (!file) {
    throw new Error("Please choose an image before submitting.");
  }

  const fileBase64 = await convertFileToBase64(file);
  const { data } = await api.post("/upload", {
    folder,
    fileName: file.name || `upload-${Date.now()}.jpg`,
    contentType: file.type,
    fileBase64,
  });
  return data;
}

export async function reverseGeocode({ latitude, longitude }) {
  const { data } = await axios.get("https://nominatim.openstreetmap.org/reverse", {
    params: {
      lat: latitude,
      lon: longitude,
      format: "jsonv2",
    },
    headers: {
      Accept: "application/json",
    },
  });
  return data;
}
export async function fetchWeatherContext({ latitude, longitude }) {
  const { data } = await api.get("/weather-context", {
    params: {
      latitude,
      longitude,
    },
  });
  return data;
}

export async function fetchSatellitePreview(params) {
  const response = await api.get("/satellite/preview", {
    params,
    responseType: "blob",
  });

  return URL.createObjectURL(response.data);
}

export async function pushNotification(message, title = "ArenIQ Alert") {
  const topic = import.meta.env.VITE_NTFY_TOPIC || "areniq-alerts";
  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      Title: title,
      Priority: "high",
      Tags: "warning,water",
    },
    body: message,
  });
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || "";
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default api;
