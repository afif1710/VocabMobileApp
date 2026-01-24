import { bulkInsertCards, createDeck, updateDeck, getDatabase, clearAllData } from '../utils/database';

const basicVocabulary = require('./vocab/basic.json');
const schoolVocabulary = require('./vocab/school.json');
const travelVocabulary = require('./vocab/travel.json');

async function getCounts() {
  const db = await getDatabase();
  const deckRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM decks');
  const cardRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  return { decks: deckRow?.count ?? 0, cards: cardRow?.count ?? 0 };
}

export async function seedDatabase(): Promise<void> {
  const expectedTotal = basicVocabulary.length + schoolVocabulary.length + travelVocabulary.length;

  const before = await getCounts();
  console.log('[Seed] Expected total:', expectedTotal);
  console.log('[Seed] DB before:', before);

  // If partial, wipe and reseed (prevents getting stuck at 450 again)
  if (!(before.decks >= 3 && before.cards >= expectedTotal)) {
    if (before.decks > 0 || before.cards > 0) await clearAllData();

    const basicDeck = await createDeck({
      name: 'Basic English',
      description: 'Essential everyday vocabulary for beginners.',
      cardCount: 0,
      isPreloaded: true,
      color: '#4CAF50',
      icon: 'book',
    });

    const schoolDeck = await createDeck({
      name: 'Academic English',
      description: 'Academic and school-related vocabulary.',
      cardCount: 0,
      isPreloaded: true,
      color: '#2196F3',
      icon: 'school',
    });

    const travelDeck = await createDeck({
      name: 'Travel & TOEFL',
      description: 'Travel phrases and TOEFL preparation vocabulary.',
      cardCount: 0,
      isPreloaded: true,
      color: '#FF9800',
      icon: 'airplane',
    });

    await bulkInsertCards(basicVocabulary.map((v: any) => ({ ...v, deckId: basicDeck.id })));
    await bulkInsertCards(schoolVocabulary.map((v: any) => ({ ...v, deckId: schoolDeck.id })));
    await bulkInsertCards(travelVocabulary.map((v: any) => ({ ...v, deckId: travelDeck.id })));

    await updateDeck(basicDeck.id, { cardCount: basicVocabulary.length });
    await updateDeck(schoolDeck.id, { cardCount: schoolVocabulary.length });
    await updateDeck(travelDeck.id, { cardCount: travelVocabulary.length });
  }

  const after = await getCounts();
  console.log('[Seed] DB after:', after);
}
