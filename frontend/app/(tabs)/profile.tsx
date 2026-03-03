import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, Divider, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '../../src/stores/appStore';
import { getDatabase, clearAllData } from '../../src/utils/database';
import { seedDatabase } from '../../src/data/seedData';
import { Button, Card } from '../../src/components';

async function getCounts() {
  const db = await getDatabase();
  const deckRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM decks');
  const cardRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  return { decks: deckRow?.count ?? 0, cards: cardRow?.count ?? 0 };
}

export default function ProfileScreen() {
  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);
  const userProgress = useAppStore(s => s.userProgress);

  const loadDecks = useAppStore(s => s.loadDecks);

  const [counts, setCounts] = useState<{ decks: number; cards: number }>({ decks: 0, cards: 0 });
  const [busy, setBusy] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
          <ActivityIndicator animating color="#4da6ff" />
          <Text style={styles.muted}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{userProgress?.totalXp ?? 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </Card>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF4500" />
            <Text style={styles.statValue}>{userProgress?.currentStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
        </View>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="theme-light-dark" size={22} color="#888" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} color="#4da6ff" />
          </View>
        </Card>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Database Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Decks</Text>
            <Text style={styles.infoValue}>{counts.decks}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Words</Text>
            <Text style={styles.infoValue}>{counts.cards}</Text>
          </View>
          
          <View style={{ marginTop: 20, gap: 8 }}>
            <Button mode="outlined" onPress={refreshCounts} disabled={busy}>
              Refresh Stats
            </Button>
            <Button mode="outlined" onPress={resetAndReseed} loading={busy} disabled={busy} style={{ borderColor: '#ff6b6b' }} labelStyle={{ color: '#ff6b6b' }}>
              Reset & Reseed Database
            </Button>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  scroll: { padding: 16, gap: 16 },
  
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  settingsCard: { paddingVertical: 16 },
  sectionTitle: { color: '#4da6ff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { color: '#aaa', fontSize: 15, fontWeight: '500' },
  infoValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  divider: { backgroundColor: '#222', marginVertical: 4 },
  muted: { color: '#888' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
