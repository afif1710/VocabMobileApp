import * as SQLite from 'expo-sqlite';
import { VocabularyCard, Deck, UserProgress, GameSession, LeaderboardEntry, UserSettings } from '../types';
import { DEFAULT_EASE } from './sm2';
import { v4 as uuidv4 } from 'uuid';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (db) return;

  db = await SQLite.openDatabaseAsync('vocabulary_arcade.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cardCount INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER,
      isPreloaded INTEGER DEFAULT 0,
      color TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      pronunciation TEXT,
      partOfSpeech TEXT,
      meanings TEXT,
      exampleSentences TEXT,
      audioUrl TEXT,
      deckId TEXT,
      ease REAL DEFAULT ${DEFAULT_EASE},
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      nextReviewTimestamp INTEGER,
      lastReviewTimestamp INTEGER,
      reviewHistory TEXT DEFAULT '[]',
      FOREIGN KEY (deckId) REFERENCES decks(id)
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      totalXp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      currentStreak INTEGER DEFAULT 0,
      longestStreak INTEGER DEFAULT 0,
      lastPracticeDate TEXT,
      dailyGoal INTEGER DEFAULT 20,
      todayXp INTEGER DEFAULT 0,
      todayCards INTEGER DEFAULT 0,
      totalCardsLearned INTEGER DEFAULT 0,
      totalReviews INTEGER DEFAULT 0,
      achievements TEXT DEFAULT '[]',
      settings TEXT
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      gameType TEXT,
      deckId TEXT,
      startTime INTEGER,
      endTime INTEGER,
      score INTEGER,
      correctAnswers INTEGER,
      totalQuestions INTEGER,
      xpEarned INTEGER,
      combo INTEGER,
      maxCombo INTEGER
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      name TEXT,
      xp INTEGER,
      level INTEGER,
      streak INTEGER,
      rank INTEGER,
      isCurrentUser INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_cards_deckId ON cards(deckId);
    CREATE INDEX IF NOT EXISTS idx_cards_nextReview ON cards(nextReviewTimestamp);
  `);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

export async function getAllDecks(): Promise<Deck[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<any>('SELECT * FROM decks ORDER BY createdAt DESC');
  return result.map(row => ({
    ...row,
    isPreloaded: Boolean(row.isPreloaded),
  }));
}

export async function getDeck(id: string): Promise<Deck | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<any>('SELECT * FROM decks WHERE id = ?', [id]);
  if (!result) return null;
  return { ...result, isPreloaded: Boolean(result.isPreloaded) };
}

export async function createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> {
  const database = await getDatabase();
  const newDeck: Deck = {
    ...deck,
    id: uuidv4(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await database.runAsync(
    'INSERT INTO decks (id, name, description, cardCount, createdAt, updatedAt, isPreloaded, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newDeck.id, newDeck.name, newDeck.description, newDeck.cardCount, newDeck.createdAt, newDeck.updatedAt, newDeck.isPreloaded ? 1 : 0, newDeck.color, newDeck.icon]
  );

  return newDeck;
}

export async function updateDeck(id: string, updates: Partial<Deck>): Promise<void> {
  const database = await getDatabase();
  const deck = await getDeck(id);
  if (!deck) return;

  const updated = { ...deck, ...updates, updatedAt: Date.now() };
  await database.runAsync(
    'UPDATE decks SET name = ?, description = ?, cardCount = ?, updatedAt = ?, color = ?, icon = ? WHERE id = ?',
    [updated.name, updated.description, updated.cardCount, updated.updatedAt, updated.color, updated.icon, id]
  );
}

export async function deleteDeck(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cards WHERE deckId = ?', [id]);
  await database.runAsync('DELETE FROM decks WHERE id = ?', [id]);
}

export async function getCardsForDeck(deckId: string): Promise<VocabularyCard[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<any>('SELECT * FROM cards WHERE deckId = ? ORDER BY word ASC', [deckId]);
  return result.map(parseCard);
}

export async function getAllCards(): Promise<VocabularyCard[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<any>('SELECT * FROM cards');
  return result.map(parseCard);
}

export async function getDueCards(deckId?: string): Promise<VocabularyCard[]> {
  const database = await getDatabase();
  const now = Date.now();
  let query = 'SELECT * FROM cards WHERE nextReviewTimestamp <= ?';
  let params: any[] = [now];

  if (deckId) {
    query += ' AND deckId = ?';
    params.push(deckId);
  }

  query += ' ORDER BY nextReviewTimestamp ASC';
  const result = await database.getAllAsync<any>(query, params);
  return result.map(parseCard);
}

export async function getNewCards(deckId?: string, limit: number = 10): Promise<VocabularyCard[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM cards WHERE repetitions = 0 AND reviewHistory = "[]"';
  let params: any[] = [];

  if (deckId) {
    query += ' AND deckId = ?';
    params.push(deckId);
  }

  query += ' LIMIT ?';
  params.push(limit);

  const result = await database.getAllAsync<any>(query, params);
  return result.map(parseCard);
}

export async function getCard(id: string): Promise<VocabularyCard | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<any>('SELECT * FROM cards WHERE id = ?', [id]);
  if (!result) return null;
  return parseCard(result);
}

export async function createCard(card: Omit<VocabularyCard, 'id' | 'ease' | 'interval' | 'repetitions' | 'nextReviewTimestamp' | 'reviewHistory'>): Promise<VocabularyCard> {
  const database = await getDatabase();
  const newCard: VocabularyCard = {
    ...card,
    id: uuidv4(),
    ease: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    nextReviewTimestamp: Date.now(),
    reviewHistory: [],
  };

  await database.runAsync(
    'INSERT INTO cards (id, word, pronunciation, partOfSpeech, meanings, exampleSentences, audioUrl, deckId, ease, interval, repetitions, nextReviewTimestamp, reviewHistory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newCard.id, newCard.word, newCard.pronunciation || '', newCard.partOfSpeech, JSON.stringify(newCard.meanings), JSON.stringify(newCard.exampleSentences), newCard.audioUrl || '', newCard.deckId, newCard.ease, newCard.interval, newCard.repetitions, newCard.nextReviewTimestamp, JSON.stringify(newCard.reviewHistory)]
  );

  await database.runAsync('UPDATE decks SET cardCount = cardCount + 1 WHERE id = ?', [card.deckId]);

  return newCard;
}

export async function updateCard(card: VocabularyCard): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE cards SET word = ?, pronunciation = ?, partOfSpeech = ?, meanings = ?, exampleSentences = ?, audioUrl = ?, ease = ?, interval = ?, repetitions = ?, nextReviewTimestamp = ?, lastReviewTimestamp = ?, reviewHistory = ? WHERE id = ?',
    [card.word, card.pronunciation || '', card.partOfSpeech, JSON.stringify(card.meanings), JSON.stringify(card.exampleSentences), card.audioUrl || '', card.ease, card.interval, card.repetitions, card.nextReviewTimestamp, card.lastReviewTimestamp || null, JSON.stringify(card.reviewHistory), card.id]
  );
}

export async function deleteCard(id: string, deckId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cards WHERE id = ?', [id]);
  await database.runAsync('UPDATE decks SET cardCount = cardCount - 1 WHERE id = ?', [deckId]);
}

export async function bulkInsertCards(cards: Omit<VocabularyCard, 'id' | 'ease' | 'interval' | 'repetitions' | 'nextReviewTimestamp' | 'reviewHistory'>[]): Promise<void> {
  const database = await getDatabase();

  console.log(`[bulkInsert] Starting bulk insert of ${cards.length} cards...`);

  await database.withTransactionAsync(async () => {
    const stmt = await database.prepareAsync(
      'INSERT INTO cards (id, word, pronunciation, partOfSpeech, meanings, exampleSentences, audioUrl, deckId, ease, interval, repetitions, nextReviewTimestamp, reviewHistory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      for (const card of cards) {
        const newCard: VocabularyCard = {
          ...card,
          id: uuidv4(),
          ease: DEFAULT_EASE,
          interval: 0,
          repetitions: 0,
          nextReviewTimestamp: Date.now(),
          reviewHistory: [],
        };

        await stmt.executeAsync([
          newCard.id,
          newCard.word,
          newCard.pronunciation || '',
          newCard.partOfSpeech,
          JSON.stringify(newCard.meanings),
          JSON.stringify(newCard.exampleSentences),
          newCard.audioUrl || '',
          newCard.deckId,
          newCard.ease,
          newCard.interval,
          newCard.repetitions,
          newCard.nextReviewTimestamp,
          JSON.stringify(newCard.reviewHistory)
        ]);
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });

  console.log(`[bulkInsert] Successfully inserted ${cards.length} cards.`);
}

function parseCard(row: any): VocabularyCard {
  return {
    ...row,
    meanings: JSON.parse(row.meanings || '[]'),
    exampleSentences: JSON.parse(row.exampleSentences || '[]'),
    reviewHistory: JSON.parse(row.reviewHistory || '[]'),
  };
}

export async function getUserProgress(): Promise<UserProgress> {
  const database = await getDatabase();
  let result = await database.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = "main"');

  if (!result) {
    const defaultSettings: UserSettings = {
      dailyTarget: 20,
      soundEnabled: true,
      hapticEnabled: true,
      largeFontMode: false,
      highContrastMode: false,
      sessionDuration: 5,
      cardsPerSession: 10,
    };

    await database.runAsync(
      'INSERT INTO user_progress (id, totalXp, level, currentStreak, longestStreak, lastPracticeDate, dailyGoal, todayXp, todayCards, totalCardsLearned, totalReviews, achievements, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['main', 0, 1, 0, 0, '', 20, 0, 0, 0, 0, '[]', JSON.stringify(defaultSettings)]
    );

    result = await database.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = "main"');
  }

  const today = new Date().toISOString().split('T')[0];
  if (result.lastPracticeDate !== today) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newStreak = result.lastPracticeDate === yesterday ? result.currentStreak : 0;

    await database.runAsync(
      'UPDATE user_progress SET todayXp = 0, todayCards = 0, currentStreak = ? WHERE id = "main"',
      [newStreak]
    );
    result.todayXp = 0;
    result.todayCards = 0;
    result.currentStreak = newStreak;
  }

  return {
    ...result,
    achievements: JSON.parse(result.achievements || '[]'),
    settings: JSON.parse(result.settings || '{}'),
  };
}

export async function updateUserProgress(updates: Partial<UserProgress>): Promise<void> {
  const database = await getDatabase();
  const current = await getUserProgress();
  const updated = { ...current, ...updates };
  const today = new Date().toISOString().split('T')[0];

  await database.runAsync(
    'UPDATE user_progress SET totalXp = ?, level = ?, currentStreak = ?, longestStreak = ?, lastPracticeDate = ?, dailyGoal = ?, todayXp = ?, todayCards = ?, totalCardsLearned = ?, totalReviews = ?, achievements = ?, settings = ? WHERE id = "main"',
    [updated.totalXp, updated.level, updated.currentStreak, updated.longestStreak, today, updated.dailyGoal, updated.todayXp, updated.todayCards, updated.totalCardsLearned, updated.totalReviews, JSON.stringify(updated.achievements), JSON.stringify(updated.settings)]
  );
}

export async function addXpAndUpdateProgress(xp: number, cardsReviewed: number = 1): Promise<UserProgress> {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let newStreak = progress.currentStreak;
  if (progress.lastPracticeDate !== today) {
    if (progress.lastPracticeDate === yesterday || progress.lastPracticeDate === '') {
      newStreak = progress.currentStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  const updates: Partial<UserProgress> = {
    totalXp: progress.totalXp + xp,
    todayXp: progress.todayXp + xp,
    todayCards: progress.todayCards + cardsReviewed,
    totalReviews: progress.totalReviews + cardsReviewed,
    currentStreak: newStreak,
    longestStreak: Math.max(progress.longestStreak, newStreak),
  };

  const { calculateLevel } = await import('./sm2');
  updates.level = calculateLevel(updates.totalXp!);

  await updateUserProgress(updates);
  return { ...progress, ...updates };
}

export async function saveGameSession(session: Omit<GameSession, 'id'>): Promise<GameSession> {
  const database = await getDatabase();
  const newSession: GameSession = {
    ...session,
    id: uuidv4(),
  };

  await database.runAsync(
    'INSERT INTO game_sessions (id, gameType, deckId, startTime, endTime, score, correctAnswers, totalQuestions, xpEarned, combo, maxCombo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newSession.id, newSession.gameType, newSession.deckId, newSession.startTime, newSession.endTime || null, newSession.score, newSession.correctAnswers, newSession.totalQuestions, newSession.xpEarned, newSession.combo, newSession.maxCombo]
  );

  return newSession;
}

export async function getGameSessions(gameType?: string): Promise<GameSession[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM game_sessions';
  let params: any[] = [];

  if (gameType) {
    query += ' WHERE gameType = ?';
    params.push(gameType);
  }

  query += ' ORDER BY startTime DESC LIMIT 50';
  return database.getAllAsync<GameSession>(query, params);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<any>('SELECT * FROM leaderboard ORDER BY xp DESC LIMIT 100');
  return result.map((row, index) => ({
    ...row,
    rank: index + 1,
    isCurrentUser: Boolean(row.isCurrentUser),
  }));
}

export async function updateLeaderboard(entry: Omit<LeaderboardEntry, 'rank'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO leaderboard (id, name, xp, level, streak, isCurrentUser) VALUES (?, ?, ?, ?, ?, ?)',
    [entry.id, entry.name, entry.xp, entry.level, entry.streak, entry.isCurrentUser ? 1 : 0]
  );
}

export async function initializeLeaderboard(): Promise<void> {
  const database = await getDatabase();
  const count = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM leaderboard');

  if (count && count.count === 0) {
    const aiPlayers = [
      { name: 'WordMaster', xp: 15420, level: 25, streak: 45 },
      { name: 'VocabNinja', xp: 12890, level: 22, streak: 32 },
      { name: 'LexiconPro', xp: 11200, level: 20, streak: 28 },
      { name: 'WordWhiz', xp: 9850, level: 18, streak: 21 },
      { name: 'SpeakEasy', xp: 8400, level: 16, streak: 15 },
      { name: 'GrammarGuru', xp: 7200, level: 14, streak: 12 },
      { name: 'PhraseFan', xp: 5800, level: 12, streak: 9 },
      { name: 'VerbVictor', xp: 4500, level: 10, streak: 7 },
      { name: 'NounNerd', xp: 3200, level: 8, streak: 5 },
      { name: 'AdjectiveAce', xp: 1800, level: 5, streak: 3 },
    ];

    for (const player of aiPlayers) {
      await updateLeaderboard({
        id: uuidv4(),
        ...player,
        isCurrentUser: false,
      });
    }
  }
}

export async function hasSeedData(): Promise<boolean> {
  const database = await getDatabase();
  const deckResult = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM decks WHERE isPreloaded = 1');
  const cardResult = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');

  const hasDecks = deckResult ? deckResult.count >= 3 : false;
  const hasCards = cardResult ? cardResult.count >= 100 : false;

  console.log(`[hasSeedData] Decks: ${deckResult?.count ?? 0}, Cards: ${cardResult?.count ?? 0}`);

  return hasDecks && hasCards;
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM cards;
    DELETE FROM decks;
    DELETE FROM game_sessions;
    DELETE FROM leaderboard;
    UPDATE user_progress SET totalXp = 0, level = 1, currentStreak = 0, longestStreak = 0, todayXp = 0, todayCards = 0, totalCardsLearned = 0, totalReviews = 0, achievements = '[]' WHERE id = 'main';
  `);
}
