import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { createServerComponentClient } from "../../../lib/supabaseServer";

// Updated Google Trends RSS endpoint. The older
// `/trends/trendingsearches/daily/rss` path returns 404 now.
const TRENDS_URL = "https://trends.google.com/trending/rss?geo=US";

export async function POST() {
  try {
    const response = await fetch(TRENDS_URL, {
      // Always fetch fresh data
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Google Trends RSS" },
        { status: 502 },
      );
    }

    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });
    const parsed = parser.parse(xmlText);

    const channel =
      parsed?.rss?.channel ?? parsed?.feed?.channel ?? parsed?.channel;
    let items = channel?.item ?? channel?.items ?? [];

    if (!Array.isArray(items)) {
      items = items ? [items] : [];
    }

    const supabase = createServerComponentClient();
    let newCount = 0;

    for (const item of items) {
      const rawTitle = item?.title;
      const title =
        typeof rawTitle === "string" ? rawTitle.trim() : String(rawTitle ?? "");

      if (!title) continue;

      // Random score between 1 and 10 (one decimal place)
      const trendScore =
        Math.round((Math.random() * 9 + 1 + Number.EPSILON) * 10) / 10;

      const { data: existingRows, error: selectError } = await supabase
        .from("niches")
        .select("id")
        .eq("name", title)
        .limit(1);

      if (selectError) {
        console.error("Error checking existing niche", selectError);
        continue;
      }

      if (existingRows && existingRows.length > 0) {
        const id = existingRows[0].id;
        const { error: updateError } = await supabase
          .from("niches")
          .update({
            trend_score: trendScore,
            source: "google_trends",
          })
          .eq("id", id);

        if (updateError) {
          console.error("Error updating niche", updateError);
        }
      } else {
        const { error: insertError } = await supabase.from("niches").insert({
          name: title,
          trend_score: trendScore,
          source: "google_trends",
        });

        if (insertError) {
          console.error("Error inserting niche", insertError);
        } else {
          newCount += 1;
        }
      }
    }

    return NextResponse.json({ new: newCount });
  } catch (error) {
    console.error("Unexpected error in discover-niches API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

