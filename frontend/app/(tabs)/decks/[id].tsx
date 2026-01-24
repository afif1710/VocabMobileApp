import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, Card, Text, TextInput } from 'react-native-paper';

import { useAppStore } from '../../../src/stores/appStore';

export default function DeckDetailScreen() {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator animating />
          <Text style={styles.muted}>Loading deck…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()}>← Back</Button>
        <Text style={styles.title}>{currentDeck?.name ?? 'Deck'}</Text>
        <Text style={styles.muted}>
          DB cards: {cards.length} • Shown: {filtered.length}
        </Text>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={{ gap: 10 }}>
          {currentDeck?.description ? <Text style={styles.desc}>{currentDeck.description}</Text> : null}

          <TextInput
            mode="outlined"
            value={q}
            onChangeText={setQ}
            placeholder="Search word, meaning, part of speech…"
            textColor="#fff"
            placeholderTextColor="#777"
            outlineColor="#333"
            activeOutlineColor="#4da6ff"
            style={{ backgroundColor: '#0f0f0f' }}
          />
        </Card.Content>

        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => router.push({ pathname: '/(tabs)/practice', params: { deckId: id } })}
          >
            Practice this deck
          </Button>
        </Card.Actions>
      </Card>

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(c: any, idx) => String(c.id ?? idx)}
        initialNumToRender={30}
        renderItem={({ item }: any) => (
          <View style={styles.row}>
            <Text style={styles.word}>{item.word}</Text>
            <Text style={styles.meta} numberOfLines={2}>
  {item.partOfSpeech ?? ''}
  {Array.isArray(item.meanings) && item.meanings.length ? ` • ${item.meanings.join(' • ')}` : ''}
</Text>

          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.muted}>No words match your search.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 6 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  muted: { color: '#888' },

  card: { marginHorizontal: 16, marginTop: 6, backgroundColor: '#121212', borderColor: '#222', borderWidth: 1 },
  desc: { color: '#bbb', lineHeight: 20 },

  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
  row: { paddingVertical: 10, borderBottomColor: '#1f1f1f', borderBottomWidth: 1 },
  word: { color: '#fff', fontSize: 16, fontWeight: '800' },
  meta: { color: '#888', marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
});
