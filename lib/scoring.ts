export type OpportunityLabel = 'hot' | 'good' | 'average' | 'competitive';

export interface WeakSignals {
  forum_present?: boolean;
  outdated_present?: boolean;
  thin_content_present?: boolean;
  low_authority_present?: boolean;
  intent_mismatch?: boolean;
}

export interface OpportunityResult {
  score: number;
  label: OpportunityLabel;
}

export function calculateOpportunity(weakSignals: WeakSignals): OpportunityResult {
  const {
    forum_present,
    outdated_present,
    thin_content_present,
    low_authority_present,
    intent_mismatch,
  } = weakSignals ?? {};

  let score = 0;

  if (forum_present) score += 30;
  if (outdated_present) score += 25;
  if (thin_content_present) score += 20;
  if (low_authority_present) score += 15;
  if (intent_mismatch) score += 10;

  // Ensure the score stays within 0-100 just in case
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let label: OpportunityLabel;
  if (score >= 70) {
    label = 'hot';
  } else if (score >= 50) {
    label = 'good';
  } else if (score >= 30) {
    label = 'average';
  } else {
    label = 'competitive';
  }

  return { score, label };
}

