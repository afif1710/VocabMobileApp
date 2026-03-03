import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { Button, Card } from '../../src/components';

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

  const onNext = async () => {
    if (!current) return;
    setRevealed(false);
    await reviewCard(current, 'good'); // default to 'good' if just moving through
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

      <Card style={styles.card}>
        <Text style={styles.word}>{current.word}</Text>
        <Text style={styles.pos}>{current.partOfSpeech ?? ''}</Text>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Meaning</Text>
          <Text style={styles.meaning}>{meaningsText}</Text>
        </View>

        {examples.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Examples</Text>
            {examples.slice(0, 2).map((ex, i) => (
              <Text key={`${i}`} style={styles.example}>• {ex}</Text>
            ))}
          </View>
        )}

        <View style={styles.cardActions}>
          <Button mode="contained" onPress={onNext} style={{ flex: 1 }}>
            Got it! Next word
          </Button>
        </View>
      </Card>

      <View style={styles.statsCardContainer}>
        <Card style={styles.miniStatsCard}>
          <Text style={styles.miniStatsLabel}>Streak</Text>
          <Text style={styles.miniStatsValue}>{sessionCombo}</Text>
        </Card>
        <Card style={styles.miniStatsCard}>
          <Text style={styles.miniStatsLabel}>XP Earned</Text>
          <Text style={styles.miniStatsValue}>{sessionXp}</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c', padding: 16, gap: 16 },
  header: { gap: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  muted: { color: '#888', fontWeight: '600' },

  card: { paddingVertical: 20 },
  word: { color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center' },
  pos: { color: '#4da6ff', marginTop: 4, textAlign: 'center', fontWeight: '700', fontSize: 14, textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: '#222', marginVertical: 20, width: '100%' },
  
  infoSection: { marginBottom: 16 },
  sectionLabel: { color: '#666', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 },
  meaning: { color: '#fff', fontSize: 17, lineHeight: 24, fontWeight: '500' },
  example: { color: '#aaa', fontSize: 15, lineHeight: 22, marginTop: 4, fontStyle: 'italic' },

  cardActions: { marginTop: 12 },
  
  statsCardContainer: { flexDirection: 'row', gap: 12 },
  miniStatsCard: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  miniStatsLabel: { color: '#888', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  miniStatsValue: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
});
