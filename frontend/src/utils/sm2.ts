import { VocabularyCard, ReviewQuality, ReviewEntry } from '../types';

/**
 * SM-2 Spaced Repetition Algorithm
 * Based on Piotr Wozniak's SuperMemo 2 algorithm
 */

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;
export const MAX_EASE = 3.0;

export function calculateNextReview(
  card: VocabularyCard,
  quality: ReviewQuality
): { ease: number; interval: number; repetitions: number } {
  let { ease, interval, repetitions } = card;

  // Quality < 3 means the response was incorrect
  if (quality < 3) {
    // Reset repetitions and interval
    repetitions = 0;
    interval = 1;
  } else {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  }

  // Update ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ensure ease factor stays within bounds
  if (ease < MIN_EASE) ease = MIN_EASE;
  if (ease > MAX_EASE) ease = MAX_EASE;

  return { ease, interval, repetitions };
}

export function getNextReviewTimestamp(intervalDays: number): number {
  const now = Date.now();
  return now + intervalDays * 24 * 60 * 60 * 1000;
}

export function createReviewEntry(
  quality: ReviewQuality,
  interval: number,
  ease: number
): ReviewEntry {
  return {
    timestamp: Date.now(),
    quality,
    interval,
    ease,
  };
}

export function scheduleCard(
  card: VocabularyCard,
  quality: ReviewQuality
): VocabularyCard {
  const { ease, interval, repetitions } = calculateNextReview(card, quality);
  const nextReviewTimestamp = getNextReviewTimestamp(interval);
  const reviewEntry = createReviewEntry(quality, interval, ease);

  return {
    ...card,
    ease,
    interval,
    repetitions,
    nextReviewTimestamp,
    lastReviewTimestamp: Date.now(),
    reviewHistory: [...card.reviewHistory, reviewEntry],
  };
}

export function isDueForReview(card: VocabularyCard): boolean {
  return card.nextReviewTimestamp <= Date.now();
}

export function getDueCards(cards: VocabularyCard[]): VocabularyCard[] {
  return cards
    .filter(isDueForReview)
    .sort((a, b) => a.nextReviewTimestamp - b.nextReviewTimestamp);
}

export function getNewCards(cards: VocabularyCard[]): VocabularyCard[] {
  return cards.filter(card => card.repetitions === 0 && card.reviewHistory.length === 0);
}

// Convert button press to quality rating
export function getQualityFromResponse(
  responseType: 'again' | 'hard' | 'good' | 'easy'
): ReviewQuality {
  switch (responseType) {
    case 'again':
      return 0;
    case 'hard':
      return 2;
    case 'good':
      return 3;
    case 'easy':
      return 5;
    default:
      return 3;
  }
}

// Calculate XP based on performance
export function calculateXp(
  quality: ReviewQuality,
  combo: number,
  isNewCard: boolean
): number {
  let baseXp = 0;
  
  switch (quality) {
    case 5:
      baseXp = 15;
      break;
    case 4:
      baseXp = 12;
      break;
    case 3:
      baseXp = 10;
      break;
    case 2:
      baseXp = 5;
      break;
    default:
      baseXp = 2;
  }

  // New card bonus
  if (isNewCard) baseXp += 5;

  // Combo multiplier (max 3x)
  const comboMultiplier = Math.min(1 + combo * 0.1, 3);
  
  return Math.round(baseXp * comboMultiplier);
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  // Each level requires progressively more XP
  // Level 1: 0, Level 2: 100, Level 3: 250, Level 4: 450, etc.
  let level = 1;
  let xpNeeded = 0;
  while (xp >= xpNeeded) {
    level++;
    xpNeeded += level * 50;
  }
  return level - 1;
}

export function getXpForNextLevel(currentLevel: number): number {
  let totalXp = 0;
  for (let i = 2; i <= currentLevel + 1; i++) {
    totalXp += i * 50;
  }
  return totalXp;
}

export function getXpForCurrentLevel(currentLevel: number): number {
  let totalXp = 0;
  for (let i = 2; i <= currentLevel; i++) {
    totalXp += i * 50;
  }
  return totalXp;
}
