export type SerpResult = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  published_at: string | null;
};

/* ------------------------------------------------------------------ */
/*  SerpApi response shape (only the fields we use)                     */
/* ------------------------------------------------------------------ */
type SerpApiOrganicResult = {
  position: number;
  title: string;
  link: string;
  displayed_link?: string;
  snippet?: string;
  date?: string;
};

type SerpApiResponse = {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
};

/* ------------------------------------------------------------------ */
/*  Main fetcher — uses SerpApi REST endpoint, no browser required      */
/* ------------------------------------------------------------------ */
export async function fetchSerp(keyword: string): Promise<SerpResult[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    throw new Error(
      "SERPAPI_KEY is not set in environment variables. " +
        "Add SERPAPI_KEY=<your-key> to .env.local and restart the dev server.",
    );
  }

  const params = new URLSearchParams({
    engine: "google",
    q: keyword,
    api_key: apiKey,
    hl: "en",
    gl: "us",
    num: "10",
  });

  const url = `https://serpapi.com/search.json?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000); // 20-second timeout

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("SerpApi request timed out after 20s. Check network connectivity.");
    }
    throw new Error(`SerpApi network error: ${err instanceof Error ? err.message : String(err)}`);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `SerpApi request failed: ${response.status} ${response.statusText}. ${text}`,
    );
  }

  const data: SerpApiResponse = await response.json();

  if (data.error) {
    throw new Error(`SerpApi error: ${data.error}`);
  }

  const organicResults = data.organic_results ?? [];

  return organicResults.slice(0, 10).map((item) => {
    // Extract a clean domain from the URL
    let domain = item.displayed_link ?? "";
    if (!domain) {
      try {
        domain = new URL(item.link).hostname.replace(/^www\./, "");
      } catch {
        domain = "";
      }
    }

    return {
      title: item.title ?? "",
      url: item.link ?? "",
      domain,
      snippet: item.snippet ?? "",
      published_at: item.date ?? null,
    };
  });
}
