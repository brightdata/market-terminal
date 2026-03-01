import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

let _client: ConvexHttpClient | null | undefined;

export function getConvexClient(): ConvexHttpClient | null {
  if (_client !== undefined) return _client;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    _client = null;
    return null;
  }
  _client = new ConvexHttpClient(url);
  return _client;
}

export { api };
