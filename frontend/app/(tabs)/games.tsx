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

  const [mode, setMode] = useState<'menu' | 'quiz'>('menu');
  const [allCardsForQuiz, setAllCardsForQuiz] = useState<any[]>([]);
  const [quizCards, setQuizCards] = useState<any[]>([]);
  const [quizState, setQuizState] = useState({
    score: 0,
    currentQuestion: 0,
    totalQuestions: 10,
    options: [] as string[],
    isFinished: false,
    streak: 0,
    showFeedback: false,
    selectedOption: null as string | null,
    isCorrect: false,
  });

  const generateOptions = (correctWord: string, pool: any[]) => {
    const distractors = pool
      .filter(c => c.word !== correctWord)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(c => c.word);
    
    // Fallback if not enough distractors in pool
    while (distractors.length < 3) {
      distractors.push(`Option ${distractors.length + 1}`);
    }
    
    return [correctWord, ...distractors].sort(() => 0.5 - Math.random());
  };

  const startQuiz = async () => {
    try {
      const cards = await useAppStore.getState().cards;
      // If store cards are empty, try to load them
      let pool = cards;
      if (pool.length === 0) {
        const { getAllCards } = await import('../../src/utils/database');
        pool = await getAllCards();
      }

      if (pool.length < 4) {
        alert("Not enough cards to play the quiz!");
        return;
      }

      // Shuffle and pick 10 random cards
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);
      
      setAllCardsForQuiz(pool);
      setQuizCards(selected);
      setQuizState({
        score: 0,
        currentQuestion: 0,
        totalQuestions: selected.length,
        options: generateOptions(selected[0].word, pool),
        isFinished: false,
        streak: 0,
        showFeedback: false,
        selectedOption: null,
        isCorrect: false,
      });
      setMode('quiz');
    } catch (error) {
      console.error("Failed to start quiz:", error);
    }
  };

  const handleOptionPress = async (option: string) => {
    if (quizState.showFeedback) return;
    
    const currentCard = quizCards[quizState.currentQuestion];
    const isCorrect = option === currentCard.word;
    
    setQuizState(prev => ({
      ...prev,
      selectedOption: option,
      isCorrect,
      showFeedback: true,
      score: isCorrect ? prev.score + 1 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));

    await reviewCard(currentCard, isCorrect ? 'good' : 'again');

    setTimeout(() => {
      setQuizState(prev => {
        if (prev.currentQuestion + 1 >= prev.totalQuestions) {
          return { ...prev, isFinished: true, showFeedback: false };
        } else {
          const nextIndex = prev.currentQuestion + 1;
          return {
            ...prev,
            currentQuestion: nextIndex,
            options: generateOptions(quizCards[nextIndex].word, allCardsForQuiz),
            showFeedback: false,
            selectedOption: null,
          };
        }
      });
    }, 1500);
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
          <Card.Title title="Speed Quiz" subtitle="Multiple choice vocabulary challenge" />
          <Card.Actions>
            <Button mode="contained" onPress={startQuiz}>
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

  if (quizState.isFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Quiz Finished!</Text>
          <Text style={styles.prompt}>Score: {quizState.score} / {quizState.totalQuestions}</Text>
          <Text style={styles.muted}>Accuracy: {Math.round((quizState.score / quizState.totalQuestions) * 100)}%</Text>
          <Button mode="contained" onPress={() => setMode('menu')} style={{ marginTop: 20 }}>
            Back to Menu
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuizCard = quizCards[quizState.currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Button mode="text" onPress={() => setMode('menu')}>← Back</Button>
        <Text style={styles.title}>Speed Quiz</Text>
        <View style={{ flex: 1 }} />
        <Button 
          mode="outlined" 
          onPress={() => setMode('menu')} 
          style={{ borderColor: '#ff6b6b' }} 
          labelStyle={{ color: '#ff6b6b' }}
        >
          Forfeit
        </Button>
      </View>
      
      <View style={{ paddingHorizontal: 4 }}>
        <Text style={styles.muted}>Question {quizState.currentQuestion + 1} of {quizState.totalQuestions}</Text>
        <Text style={styles.muted}>Streak: {quizState.streak}</Text>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={{ gap: 20, paddingVertical: 20 }}>
          <Text style={styles.label}>What is the word for:</Text>
          <Text style={styles.prompt}>
            {Array.isArray(currentQuizCard?.meanings) ? currentQuizCard.meanings[0] : String(currentQuizCard?.meanings)}
          </Text>

          <View style={{ gap: 10, marginTop: 10 }}>
            {quizState.options.map((option, index) => {
              const isSelected = quizState.selectedOption === option;
              const isCorrect = option === currentQuizCard.word;
              let buttonColor = '#1e1e1e';
              let textColor = '#fff';

              if (quizState.showFeedback) {
                if (isCorrect) {
                  buttonColor = '#2e7d32';
                } else if (isSelected && !isCorrect) {
                  buttonColor = '#c62828';
                }
              }

              return (
                <Button
                  key={index}
                  mode="contained"
                  onPress={() => handleOptionPress(option)}
                  style={{ backgroundColor: buttonColor, borderRadius: 8, paddingVertical: 4 }}
                  labelStyle={{ color: textColor, fontSize: 16 }}
                  disabled={quizState.showFeedback}
                >
                  {option}
                </Button>
              );
            })}
          </View>

          {quizState.showFeedback && (
            <Text style={[styles.feedback, { color: quizState.isCorrect ? '#49d17c' : '#ff6b6b' }]}>
              {quizState.isCorrect ? '✓ Correct!' : `✗ Incorrect! It's "${currentQuizCard.word}"`}
            </Text>
          )}
        </Card.Content>
      </Card>
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
  label: { color: '#aaa', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  prompt: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 28, textAlign: 'center' },
  feedback: { fontWeight: '900', fontSize: 18, textAlign: 'center', marginTop: 10 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
});
