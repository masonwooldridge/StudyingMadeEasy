const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

export const API_URL = (
  configuredApiUrl || "http://localhost:8000"
).replace(/\/$/, "");
