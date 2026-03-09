// Vocabulary Card Model with SM-2 fields
export interface VocabularyCard {
  id: string;
  word: string;
  pronunciation?: string;
  partOfSpeech: string;
  meanings: string[];
  exampleSentences: string[];
  audioUrl?: string;
  deckId: string;
  // SM-2 Algorithm fields
  ease: number; // Easiness factor (default 2.5)
  interval: number; // Days until next review
  repetitions: number; // Number of consecutive correct responses
  nextReviewTimestamp: number; // Unix timestamp
  lastReviewTimestamp?: number;
  reviewHistory: ReviewEntry[];
}

export interface ReviewEntry {
  timestamp: number;
  quality: number; // 0-5 rating
  interval: number;
  ease: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  createdAt: number;
  updatedAt: number;
  isPreloaded: boolean;
  color: string;
  icon: string;
}

export interface UserProgress {
  id: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string;
  dailyGoal: number;
  todayXp: number;
  todayCards: number;
  totalCardsLearned: number;
  totalReviews: number;
  achievements: Achievement[];
  settings: UserSettings;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress: number;
  target: number;
}

export interface UserSettings {
  theme?: string; // Add theme property
  dailyTarget: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  largeFontMode: boolean;
  highContrastMode: boolean;
  sessionDuration: number; // minutes
  cardsPerSession: number;
}

export interface GameSession {
  id: string;
  gameType: 'match' | 'typing' | 'listening';
  deckId: string;
  startTime: number;
  endTime?: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  combo: number;
  maxCombo: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
  isCurrentUser: boolean;
}

export type GameMode = 'match' | 'typing' | 'listening';
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
