export type SearchIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

const INFORMATIONAL_KEYWORDS = ['how to', 'what is', 'guide', 'tutorial'];
const COMMERCIAL_KEYWORDS = ['best', 'review', 'top', 'vs', 'comparison'];
const TRANSACTIONAL_KEYWORDS = ['buy', 'order', 'discount', 'coupon', 'price'];
const DEFAULT_BRAND_NAMES = ['amazon', 'walmart', 'target'];

export function computeIntent(
  query: string,
  brandNames: string[] = DEFAULT_BRAND_NAMES,
): SearchIntent {
  const q = (query || '').toLowerCase();

  // Navigational: contains known brand names
  for (const brand of brandNames) {
    if (!brand) continue;
    const pattern = new RegExp(`\\b${escapeRegex(brand.toLowerCase())}\\b`, 'i');
    if (pattern.test(q)) {
      return 'navigational';
    }
  }

  // Transactional: strong buying signals
  if (containsAny(q, TRANSACTIONAL_KEYWORDS)) {
    return 'transactional';
  }

  // Commercial: comparison / evaluation intent
  if (containsAny(q, COMMERCIAL_KEYWORDS)) {
    return 'commercial';
  }

  // Informational: learning / how-to queries
  if (containsAny(q, INFORMATIONAL_KEYWORDS)) {
    return 'informational';
  }

  // Default
  return 'informational';
}

function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase.toLowerCase()));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

