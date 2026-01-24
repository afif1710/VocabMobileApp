import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';

import { useAppStore } from '../../src/stores/appStore';
import { getDatabase, clearAllData } from '../../src/utils/database';
import { seedDatabase } from '../../src/data/seedData';

async function getCounts() {
  const db = await getDatabase();
  const deckRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM decks');
  const cardRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  return { decks: deckRow?.count ?? 0, cards: cardRow?.count ?? 0 };
}

export default function ProfileScreen() {
  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);

  const loadDecks = useAppStore(s => s.loadDecks);

  const [counts, setCounts] = useState<{ decks: number; cards: number }>({ decks: 0, cards: 0 });
  const [busy, setBusy] = useState(false);

  const refreshCounts = async () => {
    const c = await getCounts();
    setCounts(c);
  };

  useEffect(() => {
    if (!isInitialized) return;
    refreshCounts();
  }, [isInitialized]);

  const resetAndReseed = async () => {
    setBusy(true);
    try {
      await clearAllData();
      await seedDatabase();
      await loadDecks();
      await refreshCounts();
    } finally {
      setBusy(false);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator animating />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.card} mode="elevated">
        <Card.Title title="Database stats" subtitle="Use this to verify seeding" />
        <Card.Content style={{ gap: 6 }}>
          <Text style={styles.stat}>Decks: <Text style={styles.value}>{counts.decks}</Text></Text>
          <Text style={styles.stat}>Cards: <Text style={styles.value}>{counts.cards}</Text></Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" onPress={refreshCounts} disabled={busy}>
            Refresh
          </Button>
          <Button mode="contained" onPress={resetAndReseed} loading={busy} disabled={busy}>
            Reset & Reseed
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Title title="Practice buttons meaning" subtitle="Simple mapping" />
        <Card.Content style={{ gap: 6 }}>
          <Text style={styles.muted}>Forgot → review tomorrow</Text>
          <Text style={styles.muted}>Hard → review in ~3 days</Text>
          <Text style={styles.muted}>Good → review in ~7 days</Text>
          <Text style={styles.muted}>Easy → review in 14+ days</Text>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c', padding: 16, gap: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  muted: { color: '#888' },

  card: { backgroundColor: '#121212', borderColor: '#222', borderWidth: 1 },

  stat: { color: '#bbb' },
  value: { color: '#fff', fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
});
