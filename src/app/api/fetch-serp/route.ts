import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "../../../lib/supabaseServer";
import { fetchSerp } from "../../../lib/serpFetcher";
import { calculateOpportunity } from "lib/scoring";
import { computeIntent } from "lib/intent";

// A small rotating list of free proxies.
// These may be unreliable in practice and are only placeholders.
const PROXIES: string[] = [
  "http://51.158.169.123:3128",
  "http://51.159.115.233:3128",
  "http://213.59.156.119:3128",
];

function getRandomProxy() {
  if (PROXIES.length === 0) return undefined;
  return PROXIES[Math.floor(Math.random() * PROXIES.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const keywordId = body?.keywordId as string | undefined;

    if (!keywordId || typeof keywordId !== "string") {
      return NextResponse.json(
        { error: "keywordId is required" },
        { status: 400 },
      );
    }

    const supabase = createServerComponentClient();

    // Fetch the keyword text
    const { data: keyword, error: keywordError } = await supabase
      .from("keywords")
      .select("id, text")
      .eq("id", keywordId)
      .single();

    if (keywordError) {
      console.error("Error fetching keyword", keywordError);
      return NextResponse.json(
        { error: "Failed to fetch keyword" },
        { status: 500 },
      );
    }

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 },
      );
    }

    const proxy = getRandomProxy();

    const results = await fetchSerp(keyword.text, proxy);

    // Insert SERP snapshot
    const { error: snapshotError } = await supabase
      .from("serp_snapshots")
      .insert({
        keyword_id: keywordId,
        results,
      });

    if (snapshotError) {
      console.error("Error inserting SERP snapshot", snapshotError);
    }

    // Compute weak signals based on the results
    const forums = ["reddit.com", "quora.com", "medium.com"];

    const now = new Date();
    const twoYearsAgo = new Date(
      now.getFullYear() - 2,
      now.getMonth(),
      now.getDate(),
    );

    let isForum = false;
    let isOutdated = false;
    let isThin = false;
    let isLowAuthority = false;

    if (results.length > 0) {
      // is_forum
      isForum = results.some((r) =>
        forums.some((domain) => r.domain.endsWith(domain)),
      );

      // is_outdated
      isOutdated = results.some((r) => {
        if (!r.published_at) return false;
        const parsed = Date.parse(r.published_at);
        if (Number.isNaN(parsed)) return false;
        return new Date(parsed) < twoYearsAgo;
      });

      // is_thin
      const lengths = results
        .map((r) => (r.snippet ?? "").length)
        .sort((a, b) => a - b);

      const median =
        lengths.length === 0
          ? 0
          : lengths[Math.floor(lengths.length / 2)] ?? 0;

      isThin = median < 100;

      // is_low_authority
      const lowTlds = [".xyz", ".top"];
      isLowAuthority = results.some((r) =>
        lowTlds.some((tld) => r.domain.endsWith(tld)),
      );
    }

    const weakSignals = {
      is_forum: isForum,
      is_outdated: isOutdated,
      is_thin: isThin,
      is_low_authority: isLowAuthority,
    };

    const { score, label } = calculateOpportunity({
      forum_present: isForum,
      outdated_present: isOutdated,
      thin_content_present: isThin,
      low_authority_present: isLowAuthority,
      intent_mismatch: false,
    });
    const intent = computeIntent(keyword.text);

    const { error: keywordUpdateError } = await supabase
      .from("keywords")
      .update({
        last_serp_fetch: new Date().toISOString(),
        weak_signals: weakSignals,
        opportunity_score: score,
        opportunity_label: label,
        intent: intent,
      })
      .eq("id", keywordId);

    if (keywordUpdateError) {
      console.error("Error updating keyword data", keywordUpdateError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in fetch-serp API", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}