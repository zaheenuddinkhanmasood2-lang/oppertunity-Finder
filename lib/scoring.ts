export type OpportunityLabel = 'hot' | 'good' | 'average' | 'competitive';

export interface WeakSignals {
  forum_present?: boolean;
  outdated_present?: boolean;
  thin_content_present?: boolean;
  low_authority_present?: boolean;
  intent_mismatch?: boolean;
  question_intent_present?: boolean;
  content_farm_present?: boolean;
  recent_content_present?: boolean;
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
    question_intent_present,
    content_farm_present,
    recent_content_present,
  } = weakSignals ?? {};

  let score = 0;

  if (forum_present) score += 25;
  if (outdated_present) score += 20;
  if (thin_content_present) score += 15;
  if (low_authority_present) score += 10;
  if (intent_mismatch) score += 8;
  if (question_intent_present) score += 12;
  if (content_farm_present) score += 18;
  if (recent_content_present) score += 5; // Small bonus for recent content

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

