import { create } from 'zustand';
import { VocabularyCard, Deck, UserProgress, GameSession, LeaderboardEntry, UserSettings } from '../types';
import * as db from '../utils/database';
import { scheduleCard, getQualityFromResponse, calculateXp, calculateLevel } from '../utils/sm2';

interface AppState {
  // Data
  decks: Deck[];
  currentDeck: Deck | null;
  cards: VocabularyCard[];
  dueCards: VocabularyCard[];
  userProgress: UserProgress | null;
  leaderboard: LeaderboardEntry[];
  gameSessions: GameSession[];
  
  // UI State
  isLoading: boolean;
  isInitialized: boolean;
  hasSeenOnboarding: boolean;
  
  // Current session
  currentSessionCards: VocabularyCard[];
  currentCardIndex: number;
  sessionXp: number;
  sessionCombo: number;
  
  // Actions
  initialize: () => Promise<void>;
  loadDecks: () => Promise<void>;
  loadDeck: (id: string) => Promise<void>;
  loadCardsForDeck: (deckId: string) => Promise<void>;
  loadDueCards: (deckId?: string) => Promise<void>;
  loadUserProgress: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  
  // Card actions
  reviewCard: (card: VocabularyCard, response: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
  startPracticeSession: (deckId?: string, count?: number) => Promise<void>;
  nextCard: () => void;
  
  // Deck actions
  createDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Deck>;
  updateDeck: (id: string, updates: Partial<Deck>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  
  // Progress actions
  addXp: (xp: number, cardsReviewed?: number) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // Game actions
  saveGameSession: (session: Omit<GameSession, 'id'>) => Promise<void>;
  
  // Misc
  setHasSeenOnboarding: (value: boolean) => void;
  resetCombo: () => void;
  incrementCombo: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  decks: [],
  currentDeck: null,
  cards: [],
  dueCards: [],
  userProgress: null,
  leaderboard: [],
  gameSessions: [],
  isLoading: true,
  isInitialized: false,
  hasSeenOnboarding: false,
  currentSessionCards: [],
  currentCardIndex: 0,
  sessionXp: 0,
  sessionCombo: 0,

  initialize: async () => {
    try {
      set({ isLoading: true });
      await db.initDatabase();
      
      // Check for seed data and load if needed
      const hasSeed = await db.hasSeedData();
      if (!hasSeed) {
        const { seedDatabase } = await import('../data/seedData');
        await seedDatabase();
      }
      
      await db.initializeLeaderboard();
      
      // Load initial data
      await get().loadDecks();
      await get().loadUserProgress();
      await get().loadLeaderboard();
      await get().loadDueCards();
      
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isLoading: false });
    }
  },

  loadDecks: async () => {
    const decks = await db.getAllDecks();
    set({ decks });
  },

  loadDeck: async (id: string) => {
    const deck = await db.getDeck(id);
    set({ currentDeck: deck });
  },

  loadCardsForDeck: async (deckId: string) => {
    const cards = await db.getCardsForDeck(deckId);
    set({ cards });
  },

  loadDueCards: async (deckId?: string) => {
    const dueCards = await db.getDueCards(deckId);
    set({ dueCards });
  },

  loadUserProgress: async () => {
    const progress = await db.getUserProgress();
    set({ userProgress: progress });
  },

  loadLeaderboard: async () => {
    const leaderboard = await db.getLeaderboard();
    set({ leaderboard });
  },

  reviewCard: async (card: VocabularyCard, response: 'again' | 'hard' | 'good' | 'easy') => {
    const quality = getQualityFromResponse(response);
    const isNewCard = card.repetitions === 0;
    const { sessionCombo } = get();
    
    // Schedule card with SM-2
    const updatedCard = scheduleCard(card, quality);
    await db.updateCard(updatedCard);
    
    // Calculate and add XP
    const xp = calculateXp(quality, sessionCombo, isNewCard);
    await get().addXp(xp);
    
    // Update combo
    if (quality >= 3) {
      get().incrementCombo();
    } else {
      get().resetCombo();
    }
    
    // Update session XP
    set(state => ({ sessionXp: state.sessionXp + xp }));
    
    // Refresh due cards
    await get().loadDueCards();
  },

  startPracticeSession: async (deckId?: string, count: number = 10) => {
    const dueCards = await db.getDueCards(deckId);
    const newCards = await db.getNewCards(deckId, Math.max(0, count - dueCards.length));
    
    // Mix due cards and new cards
    const sessionCards = [...dueCards.slice(0, count), ...newCards].slice(0, count);
    
    // Shuffle
    for (let i = sessionCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sessionCards[i], sessionCards[j]] = [sessionCards[j], sessionCards[i]];
    }
    
    set({
      currentSessionCards: sessionCards,
      currentCardIndex: 0,
      sessionXp: 0,
      sessionCombo: 0,
    });
  },

  nextCard: () => {
    set(state => ({
      currentCardIndex: Math.min(state.currentCardIndex + 1, state.currentSessionCards.length - 1),
    }));
  },

  createDeck: async (deck) => {
    const newDeck = await db.createDeck(deck);
    await get().loadDecks();
    return newDeck;
  },

  updateDeck: async (id, updates) => {
    await db.updateDeck(id, updates);
    await get().loadDecks();
    if (get().currentDeck?.id === id) {
      await get().loadDeck(id);
    }
  },

  deleteDeck: async (id) => {
    await db.deleteDeck(id);
    await get().loadDecks();
    if (get().currentDeck?.id === id) {
      set({ currentDeck: null });
    }
  },

  addXp: async (xp, cardsReviewed = 1) => {
    const progress = await db.addXpAndUpdateProgress(xp, cardsReviewed);
    set({ userProgress: progress });
    
    // Update leaderboard
    await db.updateLeaderboard({
      id: 'current-user',
      name: 'You',
      xp: progress.totalXp,
      level: progress.level,
      streak: progress.currentStreak,
      isCurrentUser: true,
    });
    await get().loadLeaderboard();
  },

  updateSettings: async (settings) => {
    const progress = get().userProgress;
    if (!progress) return;
    
    const newSettings = { ...progress.settings, ...settings };
    await db.updateUserProgress({ settings: newSettings });
    await get().loadUserProgress();
  },

  saveGameSession: async (session) => {
    await db.saveGameSession(session);
    await get().addXp(session.xpEarned, session.correctAnswers);
  },

  setHasSeenOnboarding: (value) => {
    set({ hasSeenOnboarding: value });
  },

  resetCombo: () => {
    set({ sessionCombo: 0 });
  },

  incrementCombo: () => {
    set(state => ({ sessionCombo: state.sessionCombo + 1 }));
  },
}));
