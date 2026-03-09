import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text as PaperText, Divider, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '../../src/stores/appStore';
import { getDatabase, clearAllData } from '../../src/utils/database';
import { seedDatabase } from '../../src/data/seedData';
import { Button, Card } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';

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

  const { colors, mode, toggleTheme } = useTheme();

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator animating color={colors.primary} />
          <PaperText style={{ color: colors.muted }}>Loading profile…</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <PaperText style={[styles.title, { color: colors.textPrimary }]}>Stats & Settings</PaperText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FFD700" />
            <PaperText style={[styles.statValue, { color: colors.textPrimary }]}>{userProgress?.totalXp ?? 0}</PaperText>
            <PaperText style={[styles.statLabel, { color: colors.textSecondary }]}>Total XP</PaperText>
          </Card>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF4500" />
            <PaperText style={[styles.statValue, { color: colors.textPrimary }]}>{userProgress?.currentStreak ?? 0}</PaperText>
            <PaperText style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</PaperText>
          </Card>
        </View>

        <Card style={styles.settingsCard}>
          <PaperText style={[styles.sectionTitle, { color: colors.primary }]}>Appearance</PaperText>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.textSecondary} />
              <PaperText style={[styles.settingText, { color: colors.textPrimary }]}>Dark Mode</PaperText>
            </View>
            <Switch value={mode === 'dark'} onValueChange={toggleTheme} color={colors.primary} />
          </View>
        </Card>

        <Card style={styles.settingsCard}>
          <PaperText style={[styles.sectionTitle, { color: colors.primary }]}>Database Info</PaperText>
          <View style={styles.infoRow}>
            <PaperText style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Decks</PaperText>
            <PaperText style={[styles.infoValue, { color: colors.textPrimary }]}>{counts.decks}</PaperText>
          </View>
          <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <PaperText style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Words</PaperText>
            <PaperText style={[styles.infoValue, { color: colors.textPrimary }]}>{counts.cards}</PaperText>
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
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '900' },
  scroll: { padding: 16, gap: 16 },
  
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  settingsCard: { paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingText: { fontSize: 16, fontWeight: '600' },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { fontSize: 15, fontWeight: '500' },
  infoValue: { fontSize: 16, fontWeight: '700' },
  
  divider: { marginVertical: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
