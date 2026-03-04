import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ActivityIndicator, Text as PaperText } from 'react-native-paper';

import { useAppStore } from '../../../src/stores/appStore';

import { DeckCard } from '../../../src/components/DeckCard';

export default function DecksIndexScreen() {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator animating />
          <PaperText style={styles.muted}>Loading decks…</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <PaperText style={styles.title}>Decks</PaperText>
        <PaperText style={styles.muted}>{decks.length} deck(s)</PaperText>
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
            <PaperText style={styles.emptyTitle}>No decks found</PaperText>
            <PaperText style={styles.muted}>If seeding failed, restart the app after fixing init errors.</PaperText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  muted: { color: '#888' },

  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: '#121212', borderColor: '#222', borderWidth: 1 },
  desc: { color: '#bbb', marginTop: 6, lineHeight: 20 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
