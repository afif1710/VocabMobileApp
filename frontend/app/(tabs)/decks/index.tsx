import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ActivityIndicator, Text as PaperText } from 'react-native-paper';

import { useAppStore } from '../../../src/stores/appStore';

import { DeckCard } from '../../../src/components/DeckCard';
import { useTheme } from '../../../src/theme/ThemeContext';

export default function DecksIndexScreen() {
  const { colors } = useTheme();
  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);
  const decks = useAppStore(s => s.decks);
  const loadDecks = useAppStore(s => s.loadDecks);

  useEffect(() => {
    if (!isInitialized) return;
    loadDecks();
  }, [isInitialized, loadDecks]);

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator animating color={colors.primary} />
          <PaperText style={{ color: colors.muted }}>Loading decks…</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <PaperText style={[styles.title, { color: colors.textPrimary }]}>Decks</PaperText>
        <PaperText style={{ color: colors.muted }}>{decks.length} deck(s)</PaperText>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={decks}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <DeckCard
            deck={item}
            onPress={() => router.push({ pathname: '/(tabs)/decks/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <PaperText style={[styles.emptyTitle, { color: colors.textPrimary }]}>No decks found</PaperText>
            <PaperText style={{ color: colors.muted }}>If seeding failed, restart the app after fixing init errors.</PaperText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 4 },
  title: { fontSize: 24, fontWeight: '800' },

  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderWidth: 1 },
  desc: { marginTop: 6, lineHeight: 20 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
});
