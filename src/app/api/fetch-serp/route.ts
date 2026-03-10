import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "../../../lib/supabaseServer";
import { fetchSerp } from "../../../lib/serpFetcher";
import { calculateOpportunity } from "lib/scoring";
import { computeIntent } from "lib/intent";


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

    const results = await fetchSerp(keyword.text);

    // Insert SERP snapshot
    const { error: snapshotError } = await supabase
      .from("serp_snapshots")
      .insert({
        keyword_id: keywordId,
        results,
      });

    if (snapshotError) {
      console.error("Error inserting SERP snapshot", snapshotError);
      return NextResponse.json(
        { error: `Failed to save SERP snapshot: ${snapshotError.message}` },
        { status: 500 },
      );
    }

    // Compute weak signals based on the results
    const forums = [
      "reddit.com", "quora.com", "medium.com", "discord.com", "facebook.com",
      "twitter.com", "instagram.com", "tiktok.com", "linkedin.com", "pinterest.com"
    ];
    
    const questionIndicators = ["?", "how", "what", "when", "where", "why", "who"];
    const lowAuthorityTlds = [".xyz", ".top", ".click", ".link", ".download", ".win"];
    const contentFarmIndicators = ["wikihow", "answers.com", "ezinearticles", "hubpages"];
    
    const now = new Date();
    const oneYearAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate(),
    );
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      now.getDate(),
    );

    let isForum = false;
    let isOutdated = false;
    let isThin = false;
    let isLowAuthority = false;
    let hasQuestionIntent = false;
    let hasContentFarm = false;
    let hasRecentContent = false;

    if (results.length > 0) {
      // is_forum - expanded to include social platforms
      isForum = results.some((r) =>
        forums.some((domain) => r.domain.includes(domain)),
      );

      // has_question_intent - check if results contain Q&A content
      hasQuestionIntent = results.some((r) => 
        questionIndicators.some(indicator => 
          r.title.toLowerCase().includes(indicator) || 
          r.snippet.toLowerCase().includes(indicator)
        )
      );

      // is_outdated - more lenient (1 year instead of 2)
      isOutdated = results.some((r) => {
        if (!r.published_at) return false;
        const parsed = Date.parse(r.published_at);
        if (Number.isNaN(parsed)) return false;
        return new Date(parsed) < oneYearAgo;
      });

      // has_recent_content - check for very recent content (opportunity indicator)
      hasRecentContent = results.some((r) => {
        if (!r.published_at) return false;
        const parsed = Date.parse(r.published_at);
        if (Number.isNaN(parsed)) return false;
        return new Date(parsed) > sixMonthsAgo;
      });

      // is_thin - adjusted threshold (80 characters instead of 100)
      const lengths = results
        .map((r) => (r.snippet ?? "").length)
        .sort((a, b) => a - b);

      const median =
        lengths.length === 0
          ? 0
          : lengths[Math.floor(lengths.length / 2)] ?? 0;

      isThin = median < 80;

      // is_low_authority - expanded TLD list and content farm detection
      isLowAuthority = results.some((r) =>
        lowAuthorityTlds.some((tld) => r.domain.endsWith(tld)) ||
        contentFarmIndicators.some((indicator) => r.domain.toLowerCase().includes(indicator))
      );
      
      // has_content_farm - separate detection for content farms
      hasContentFarm = results.some((r) =>
        contentFarmIndicators.some((indicator) => r.domain.toLowerCase().includes(indicator))
      );
    }

    const weakSignals = {
      is_forum: isForum,
      is_outdated: isOutdated,
      is_thin: isThin,
      is_low_authority: isLowAuthority,
      has_question_intent: hasQuestionIntent,
      has_content_farm: hasContentFarm,
      has_recent_content: hasRecentContent,
    };

    const { score, label } = calculateOpportunity({
      forum_present: isForum,
      outdated_present: isOutdated,
      thin_content_present: isThin,
      low_authority_present: isLowAuthority,
      intent_mismatch: false,
      question_intent_present: hasQuestionIntent,
      content_farm_present: hasContentFarm,
      recent_content_present: hasRecentContent,
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
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unexpected error in fetch-serp API", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}