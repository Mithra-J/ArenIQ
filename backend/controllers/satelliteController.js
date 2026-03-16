async function getSentinelToken() {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SENTINEL_CLIENT_ID || "",
    client_secret: process.env.SENTINEL_CLIENT_SECRET || "",
  });

  const response = await fetch("https://services.sentinel-hub.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Sentinel Hub token request failed with status ${response.status}`);
  }

  return response.json();
}

async function getSatellitePreview(req, res, next) {
  try {
    const { bbox = "80.11,13.01,80.19,13.08", from = "2026-01-01", to = "2026-03-15" } = req.query;
    const token = await getSentinelToken();

    const response = await fetch("https://services.sentinel-hub.com/api/v1/process", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          bounds: {
            bbox: bbox.split(",").map(Number),
          },
          data: [
            {
              type: "sentinel-2-l2a",
              dataFilter: {
                timeRange: {
                  from: `${from}T00:00:00Z`,
                  to: `${to}T23:59:59Z`,
                },
              },
            },
          ],
        },
        output: {
          width: 512,
          height: 512,
          responses: [{ identifier: "default", format: { type: "image/png" } }],
        },
        evalscript: `
          //VERSION=3
          function setup() {
            return { input: ["B04", "B03", "B02"], output: { bands: 3 } };
          }
          function evaluatePixel(sample) {
            return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5];
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sentinel Hub process request failed with status ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSatellitePreview,
};
