const { Buffer } = require("node:buffer");
const { supabaseAdmin } = require("../database/supabase");

async function uploadFile(req, res, next) {
  try {
    const {
      bucket = process.env.SUPABASE_REPORTS_BUCKET || "report-photos",
      fileName,
      contentType = "image/jpeg",
      fileBase64,
      folder = "reports",
    } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: "fileBase64 is required" });
    }

    const cleanBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    const safeFileName = fileName || `upload-${Date.now()}.jpg`;
    const fileBuffer = Buffer.from(cleanBase64, "base64");
    const objectPath = `${folder}/${Date.now()}-${safeFileName}`;

    const { error } = await supabaseAdmin.storage.from(bucket).upload(objectPath, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);
    res.status(201).json({
      path: objectPath,
      publicUrl: data.publicUrl,
      bucket,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadFile,
};
