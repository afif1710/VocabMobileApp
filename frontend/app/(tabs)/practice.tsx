import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, Card, Text, Banner } from 'react-native-paper';

import { useAppStore } from '../../src/stores/appStore';

type Response = 'again' | 'hard' | 'good' | 'easy';

export default function PracticeScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();

  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);

  const startPracticeSession = useAppStore(s => s.startPracticeSession);
  const reviewCard = useAppStore(s => s.reviewCard);
  const nextCard = useAppStore(s => s.nextCard);

  const currentSessionCards = useAppStore(s => s.currentSessionCards);
  const currentCardIndex = useAppStore(s => s.currentCardIndex);
  const sessionXp = useAppStore(s => s.sessionXp);
  const sessionCombo = useAppStore(s => s.sessionCombo);

  const current = useMemo(
    () => currentSessionCards[currentCardIndex] ?? null,
    [currentSessionCards, currentCardIndex]
  );

  const [revealed, setRevealed] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;
    startPracticeSession(deckId ?? undefined, 10);
  }, [isInitialized, startPracticeSession, deckId]);

  const meaningsText = useMemo(() => {
    if (!current?.meanings) return '';
    return Array.isArray(current.meanings) ? current.meanings.join(', ') : String(current.meanings);
  }, [current]);

  const examples = useMemo(() => {
    if (!current?.exampleSentences) return [];
    return Array.isArray(current.exampleSentences)
      ? current.exampleSentences
      : [String(current.exampleSentences)];
  }, [current]);

  const progressText = useMemo(() => {
    const total = currentSessionCards.length;
    if (!total) return 'No cards';
    return `${currentCardIndex + 1}/${total}`;
  }, [currentSessionCards.length, currentCardIndex]);

  const onGrade = async (resp: Response) => {
    if (!current) return;
    setRevealed(false);
    await reviewCard(current, resp);
    nextCard();
  };

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator animating />
          <Text style={styles.muted}>Preparing practice…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Practice</Text>
          <Text style={styles.muted}>No cards available. Check Decks tab.</Text>
          <Button mode="contained" onPress={() => startPracticeSession(deckId ?? undefined, 10)}>
            Restart session
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.muted}>
          {progressText} • XP {sessionXp} • Combo {sessionCombo}
        </Text>
      </View>

      {showHelp ? (
        <Banner
          visible
          actions={[{ label: 'Got it', onPress: () => setShowHelp(false) }]}
          icon="information"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          <Text style={{ color: '#ddd', fontSize: 13 }}>
            <Text style={{ fontWeight: '800' }}>Forgot</Text> = review soon (1 day) •{' '}
            <Text style={{ fontWeight: '800' }}>Hard</Text> = review later (3 days) •{' '}
            <Text style={{ fontWeight: '800' }}>Good</Text> = comfortable gap (7 days) •{' '}
            <Text style={{ fontWeight: '800' }}>Easy</Text> = longest wait (14+ days)
          </Text>
        </Banner>
      ) : null}

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.word}>{current.word}</Text>
          <Text style={styles.pos}>{current.partOfSpeech ?? ''}</Text>

          {revealed ? (
            <View style={{ marginTop: 12, gap: 10 }}>
              {meaningsText ? <Text style={styles.meaning}>{meaningsText}</Text> : null}
              {examples.length ? (
                <View style={{ gap: 6 }}>
                  <Text style={styles.sectionLabel}>Examples</Text>
                  {examples.slice(0, 2).map((ex, i) => (
                    <Text key={`${i}`} style={styles.example}>• {ex}</Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.mutedHint}>Tap "Show meaning" to reveal</Text>
          )}
        </Card.Content>

        <Card.Actions style={styles.actions}>
          <Button mode="outlined" onPress={() => setRevealed(v => !v)}>
            {revealed ? 'Hide' : 'Show meaning'}
          </Button>
          <Button mode="outlined" onPress={() => startPracticeSession(deckId ?? undefined, 10)}>
            New 10
          </Button>
        </Card.Actions>
      </Card>

      <View style={styles.row}>
        <Button mode="outlined" style={styles.btn} onPress={() => onGrade('again')}>
          Forgot
        </Button>
        <Button mode="outlined" style={styles.btn} onPress={() => onGrade('hard')}>
          Hard
        </Button>
      </View>

      <View style={styles.row}>
        <Button mode="contained-tonal" style={styles.btn} onPress={() => onGrade('good')}>
          Good
        </Button>
        <Button mode="contained" style={styles.btn} onPress={() => onGrade('easy')}>
          Easy
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c', padding: 16, gap: 14 },
  header: { gap: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  muted: { color: '#888' },
  mutedHint: { color: '#888', marginTop: 12 },

  card: { backgroundColor: '#121212', borderColor: '#222', borderWidth: 1 },
  word: { color: '#fff', fontSize: 34, fontWeight: '900' },
  pos: { color: '#8aa', marginTop: 6 },

  meaning: { color: '#ddd', fontSize: 16, lineHeight: 22 },
  sectionLabel: { color: '#aaa', fontWeight: '800' },
  example: { color: '#bbb', lineHeight: 20 },

  actions: { justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  btn: { flex: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
});
