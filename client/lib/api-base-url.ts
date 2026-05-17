/** Production API used when the portal runs on Vercel without NEXT_PUBLIC_API_URL. */
const HOSTED_API_URL = "https://internship-robot-omlp.vercel.app/api";

/**
 * Resolves the API base URL for browser and SSR.
 * Supervisor token links on the hosted site must not call localhost.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
    return HOSTED_API_URL;
  }

  return "http://localhost:5000/api";
}
