import { chromium } from "playwright";

export type SerpResult = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  published_at: string | null;
};

const USER_AGENTS = [
  // A small rotating set of realistic desktop UAs
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function fetchSerp(
  keyword: string,
  proxy?: string,
): Promise<SerpResult[]> {
  const q = encodeURIComponent(keyword);
  const url = `https://www.google.com/search?q=${q}&hl=en`;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
    proxy: proxy ? { server: proxy } : undefined,
  });

  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    locale: "en-US",
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for organic results to appear
    await page.waitForSelector("div.g", { timeout: 15000 }).catch(() => {});

    const rawResults = await page.$$eval("div.g", (nodes) =>
      nodes
        .map((node) => {
          const titleEl = node.querySelector("h3");
          const linkEl = node.querySelector("a");

          // Google changes snippet markup; try a few common containers
          const snippetEl =
            node.querySelector("div[data-sncf]") ||
            node.querySelector("div.VwiC3b") ||
            node.querySelector("span.aCOpRe") ||
            node.querySelector("div[role='presentation']");

          // Date is often in a preceding span, sometimes within snippet
          const dateEl =
            node.querySelector("span[aria-hidden='true'] time") ||
            node.querySelector("span.f") ||
            node.querySelector("span[data-dobid='date']");

          const title = titleEl?.textContent?.trim() ?? "";
          const href = linkEl?.getAttribute("href") ?? "";
          const snippet = snippetEl?.textContent?.trim() ?? "";
          const dateText = dateEl?.textContent?.trim() ?? "";

          if (!title || !href) {
            return null;
          }

          return {
            title,
            url: href,
            snippet,
            dateText,
          };
        })
        .filter((item): item is { title: string; url: string; snippet: string; dateText: string } => !!item),
    );

    const results: SerpResult[] = rawResults.map((item) => {
      let domain = "";
      try {
        const rawUrl = item.url.startsWith("http")
          ? item.url
          : `https://www.google.com${item.url}`;
        const u = new URL(rawUrl);
        domain = u.hostname.replace(/^www\./, "");
      } catch {
        domain = "";
      }

      return {
        title: item.title,
        url: item.url,
        domain,
        snippet: item.snippet,
        published_at: item.dateText || null,
      };
    });

    return results;
  } finally {
    await context.close();
    await browser.close();
  }
}

