import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, TextInput, Text as PaperText } from 'react-native-paper';
import { Button, Card } from '../../../src/components';

import { useAppStore } from '../../../src/stores/appStore';
import { useTheme } from '../../../src/theme/ThemeContext';

export default function DeckDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);

  const currentDeck = useAppStore(s => s.currentDeck);
  const cards = useAppStore(s => s.cards);

  const loadDeck = useAppStore(s => s.loadDeck);
  const loadCardsForDeck = useAppStore(s => s.loadCardsForDeck);

  const [q, setQ] = useState('');

  useEffect(() => {
    if (!isInitialized) return;
    if (!id) return;
    loadDeck(id);
    loadCardsForDeck(id);
  }, [isInitialized, id, loadDeck, loadCardsForDeck]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return cards;

    return cards.filter((c: any) => {
      const word = String(c.word ?? '').toLowerCase();
      const pos = String(c.partOfSpeech ?? '').toLowerCase();
      const meanings = Array.isArray(c.meanings) ? c.meanings.join(' ') : String(c.meanings ?? '');
      return (
        word.includes(query) ||
        pos.includes(query) ||
        meanings.toLowerCase().includes(query)
      );
    });
  }, [cards, q]);

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator animating color={colors.primary} />
          <PaperText style={{ color: colors.muted }}>Loading deck…</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} style={{ marginVertical: 0 }}>← Back</Button>
        <PaperText style={[styles.title, { color: colors.textPrimary }]}>{currentDeck?.name ?? 'Deck'}</PaperText>
        <PaperText style={{ color: colors.muted }}>
          DB cards: {cards.length} • Shown: {filtered.length}
        </PaperText>
      </View>

      <Card style={styles.card}>
        <View style={{ gap: 10 }}>
          {currentDeck?.description ? <PaperText style={[styles.desc, { color: colors.textSecondary }]}>{currentDeck.description}</PaperText> : null}

          <TextInput
            mode="outlined"
            value={q}
            onChangeText={setQ}
            placeholder="Search word, meaning, part of speech…"
            textColor={colors.textPrimary}
            placeholderTextColor={colors.muted}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            style={{ backgroundColor: colors.surface }}
          />

          <Button
            mode="contained"
            onPress={() => router.push({ pathname: '/(tabs)/practice', params: { deckId: id } })}
            style={{ marginTop: 8 }}
          >
            Practice this deck
          </Button>
        </View>
      </Card>

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(c: any, idx) => String(c.id ?? idx)}
        initialNumToRender={30}
        renderItem={({ item }: any) => (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <PaperText style={[styles.word, { color: colors.textPrimary }]}>{item.word}</PaperText>
            <PaperText style={[styles.meta, { color: colors.muted }]} numberOfLines={2}>
              {item.partOfSpeech ?? ''}
              {Array.isArray(item.meanings) && item.meanings.length ? ` • ${item.meanings.join(' • ')}` : ''}
            </PaperText>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <PaperText style={{ color: colors.muted }}>No words match your search.</PaperText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 6 },
  title: { fontSize: 22, fontWeight: '900' },

  card: { marginHorizontal: 16, marginTop: 6 },
  desc: { lineHeight: 20, marginBottom: 10 },

  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
  row: { paddingVertical: 10, borderBottomWidth: 1 },
  word: { fontSize: 16, fontWeight: '800' },
  meta: { marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
});
