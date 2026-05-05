const AZURE_BLOB_SAS_URL = "__S3_UPLOAD_BASE_URL__";
const BLOB_API_VERSION = "2025-11-05";

function buildBlobUrl(blobName) {
  const url = new URL(AZURE_BLOB_SAS_URL);
  const containerPath = url.pathname.endsWith("/")
    ? url.pathname.slice(0, -1)
    : url.pathname;
  url.pathname = `${containerPath}/${encodeURIComponent(blobName)}`;
  return url.toString();
}

async function uploadSubmission(data) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rnd = Math.random().toString(36).slice(2, 8);
  const blobName = `submissions/submission-${ts}-${rnd}.json`;
  const body = JSON.stringify(data);
  const response = await fetch(buildBlobUrl(blobName), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ms-blob-type": "BlockBlob",
      "x-ms-version": BLOB_API_VERSION,
    },
    body,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Upload failed: ${response.status} ${response.statusText}${text ? ` — ${text.trim()}` : ""}`,
    );
  }
  return blobName;
}
