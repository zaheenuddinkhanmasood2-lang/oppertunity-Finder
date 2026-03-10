import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "../../../lib/supabaseServer";
import { computeIntent } from "lib/intent";

const QUESTION_WORDS = ["who", "what", "where", "when", "why", "how"];
const LETTER_PREFIXES = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(97 + i),
);
const DIGIT_PREFIXES = Array.from({ length: 10 }, (_, i) => String(i));

const PREFIXES = [...LETTER_PREFIXES, ...DIGIT_PREFIXES, ...QUESTION_WORDS];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const nicheId = body?.nicheId as string | undefined;

    if (!nicheId || typeof nicheId !== "string") {
      return NextResponse.json(
        { error: "nicheId is required" },
        { status: 400 },
      );
    }

    const supabase = createServerComponentClient();

    // Fetch the niche to get its name
    const { data: niche, error: nicheError } = await supabase
      .from("niches")
      .select("id, name")
      .eq("id", nicheId)
      .single();

    if (nicheError) {
      console.error("Error fetching niche", nicheError);
      return NextResponse.json(
        { error: "Failed to fetch niche" },
        { status: 500 },
      );
    }

    if (!niche) {
      return NextResponse.json(
        { error: "Niche not found" },
        { status: 404 },
      );
    }

    const suggestions = new Set<string>();

    // Fetch Google autocomplete suggestions for each prefix
    await Promise.all(
      PREFIXES.map(async (prefix) => {
        const query = `${niche.name} ${prefix}`;
        const url = `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
          query,
        )}`;

        try {
          const res = await fetch(url);
          if (!res.ok) return;

          const data = await res.json();
          const arr = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];

          for (const raw of arr) {
            if (typeof raw !== "string") continue;
            const normalized = raw.toLowerCase().trim();
            if (!normalized) continue;
            suggestions.add(normalized);
          }
        } catch (err) {
          console.error("Error fetching suggestions for prefix", prefix, err);
        }
      }),
    );

    const all = Array.from(suggestions).slice(0, 100);

    if (all.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    const rows = all.map((text) => {
      const intent = computeIntent(text);
      return {
        niche_id: niche.id,
        text,
        word_count: text.split(/\s+/).filter(Boolean).length,
        intent,
      };
    });

    const { error: insertError } = await supabase.from("keywords").insert(rows);

    if (insertError) {
      console.error("Error inserting keywords", insertError);
      return NextResponse.json(
        { error: "Failed to insert keywords" },
        { status: 500 },
      );
    }

    return NextResponse.json({ inserted: rows.length });
  } catch (err) {
    console.error("Unexpected error in generate-keywords API", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}

