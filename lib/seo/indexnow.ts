const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://api.search.brave.com/indexnow",
];

export async function submitUrls(urls: string[]): Promise<void> {
  if (!INDEXNOW_KEY || urls.length === 0) return;

  const payload = {
    host: "taxitao.co.ke",
    key: INDEXNOW_KEY,
    keyLocation: `https://taxitao.co.ke/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } catch {
      // IndexNow is best-effort; don't fail the request
    }
  }
}

export function getBaseUrl(): string {
  return "https://taxitao.co.ke";
}
