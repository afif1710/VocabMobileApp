import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Card, Text, TextInput } from 'react-native-paper';

import { useAppStore } from '../../src/stores/appStore';

export default function GamesScreen() {
  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);

  const startPracticeSession = useAppStore(s => s.startPracticeSession);
  const reviewCard = useAppStore(s => s.reviewCard);
  const nextCard = useAppStore(s => s.nextCard);

  const sessionCards = useAppStore(s => s.currentSessionCards);
  const currentCardIndex = useAppStore(s => s.currentCardIndex);

  const [mode, setMode] = useState<'menu' | 'typing'>('menu');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctAnswer, setCorrectAnswer] = useState('');

  useEffect(() => {
    if (!isInitialized) return;
    startPracticeSession(undefined, 10);
  }, [isInitialized, startPracticeSession]);

  const current = useMemo(
    () => sessionCards[currentCardIndex] ?? null,
    [sessionCards, currentCardIndex]
  );

  const promptMeaning = useMemo(() => {
    if (!current?.meanings) return '';
    return Array.isArray(current.meanings) ? current.meanings[0] : String(current.meanings);
  }, [current]);

  const submit = async () => {
    if (!current) return;
    const correct = current.word.trim().toLowerCase();
    const typed = answer.trim().toLowerCase();

    if (!typed) return;

    if (typed === correct) {
      setResult('correct');
      await reviewCard(current, 'good');
      setAnswer('');
      setTimeout(() => {
        setResult('idle');
        nextCard();
      }, 1200);
    } else {
      setResult('wrong');
      setCorrectAnswer(current.word);
      await reviewCard(current, 'again');
      setAnswer('');
      setTimeout(() => {
        setResult('idle');
        setCorrectAnswer('');
        nextCard();
      }, 2500);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator animating />
          <Text style={styles.muted}>Loading games…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Games</Text>
          <Text style={styles.muted}>Quick vocabulary challenges</Text>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Title title="Typing Sprint" subtitle="Type the word from its meaning" />
          <Card.Actions>
            <Button mode="contained" onPress={() => setMode('typing')}>
              Play now
            </Button>
          </Card.Actions>
        </Card>

        <Card style={[styles.card, { opacity: 0.5 }]} mode="elevated">
          <Card.Title title="Match & Listening" subtitle="Match and Listening games are coming in the next update" />
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Button mode="text" onPress={() => setMode('menu')}>← Back</Button>
        <Text style={styles.title}>Typing Sprint</Text>
      </View>

      {!current ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No cards loaded.</Text>
          <Button mode="contained" onPress={() => startPracticeSession(undefined, 10)}>
            Reload
          </Button>
        </View>
      ) : (
        <Card style={styles.card} mode="elevated">
          <Card.Content style={{ gap: 12 }}>
            <Text style={styles.label}>Meaning:</Text>
            <Text style={styles.prompt}>{promptMeaning}</Text>

            <TextInput
              mode="outlined"
              value={answer}
              onChangeText={setAnswer}
              placeholder="Type the word…"
              textColor="#fff"
              placeholderTextColor="#777"
              outlineColor="#333"
              activeOutlineColor="#4da6ff"
              style={{ backgroundColor: '#0f0f0f' }}
              onSubmitEditing={submit}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
              editable={result === 'idle'}
            />

            {result === 'correct' ? (
              <Text style={styles.good}>✓ Correct!</Text>
            ) : null}
            {result === 'wrong' ? (
              <Text style={styles.bad}>✗ Wrong — correct answer: "{correctAnswer}"</Text>
            ) : null}

            <Button mode="contained" onPress={submit} disabled={result !== 'idle'}>
              {result === 'idle' ? 'Submit' : 'Wait…'}
            </Button>
          </Card.Content>
        </Card>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c', padding: 16, gap: 12 },
  header: { gap: 6, marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  muted: { color: '#888' },

  card: { backgroundColor: '#121212', borderColor: '#222', borderWidth: 1 },
  label: { color: '#aaa', fontSize: 14, fontWeight: '700' },
  prompt: { color: '#fff', fontSize: 19, fontWeight: '700', lineHeight: 26 },
  good: { color: '#49d17c', fontWeight: '900', fontSize: 16 },
  bad: { color: '#ff6b6b', fontWeight: '900', fontSize: 15, lineHeight: 22 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
});
