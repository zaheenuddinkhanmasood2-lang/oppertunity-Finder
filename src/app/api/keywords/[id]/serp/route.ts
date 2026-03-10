import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "../../../../../lib/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createServerComponentClient();

  // Fetch the keyword with its scored metadata
  const { data: keyword, error: keywordError } = await supabase
    .from("keywords")
    .select(
      "id, text, intent, opportunity_score, opportunity_label, weak_signals, last_serp_fetch",
    )
    .eq("id", id)
    .single();

  if (keywordError || !keyword) {
    return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
  }

  // Fetch the most recent SERP snapshot for this keyword
  const { data: snapshot, error: snapError } = await supabase
    .from("serp_snapshots")
    .select("id, results, fetch_time")
    .eq("keyword_id", id)
    .order("fetch_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Debug: log what we got
  console.log("[serp GET] keyword_id:", id);
  console.log("[serp GET] snapshot:", snapshot ? `found (id=${snapshot.id}, results=${Array.isArray(snapshot.results) ? snapshot.results.length : typeof snapshot.results} items)` : "null");
  if (snapError) console.error("[serp GET] snapshot error:", snapError);

  return NextResponse.json({
    keyword,
    snapshot: snapshot ?? null,
  });
}
