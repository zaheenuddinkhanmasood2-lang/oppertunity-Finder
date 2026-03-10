export type SearchIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

const INFORMATIONAL_KEYWORDS = ['how to', 'what is', 'guide', 'tutorial', 'who is', 'when was', 'where is', 'why did'];
const COMMERCIAL_KEYWORDS = ['best', 'review', 'top', 'vs', 'comparison', 'price', 'cost', 'cheap', 'discount'];
const TRANSACTIONAL_KEYWORDS = ['buy', 'order', 'discount', 'coupon', 'price', 'shop', 'purchase', 'deal'];
const DEFAULT_BRAND_NAMES = ['amazon', 'walmart', 'target'];
const CELEBRITY_INDICATORS = ['wife', 'husband', 'girlfriend', 'boyfriend', 'fiance', 'married', 'dating', 'relationship'];
const NEWS_INDICATORS = ['news', 'latest', 'update', 'breaking', 'scandal', 'rumor'];

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

  // Enhanced informational detection for celebrity/personal queries
  // These are still informational but we can be more specific
  if (containsAny(q, INFORMATIONAL_KEYWORDS)) {
    return 'informational';
  }

  // Celebrity/personal queries are typically informational
  // but we should check if they have commercial undertones
  const hasCelebrityIndicators = CELEBRITY_INDICATORS.some(indicator => q.includes(indicator));
  const hasNewsIndicators = NEWS_INDICATORS.some(indicator => q.includes(indicator));
  
  if (hasCelebrityIndicators || hasNewsIndicators) {
    // These are still informational but about personal/celebrity topics
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

