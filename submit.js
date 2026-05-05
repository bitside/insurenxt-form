const S3_UPLOAD_BASE_URL = "__S3_UPLOAD_BASE_URL__";

async function uploadSubmission(data) {
  const key = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  const response = await fetch(`${S3_UPLOAD_BASE_URL}/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  return key;
}
