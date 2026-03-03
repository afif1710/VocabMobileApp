import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Button, Card } from '../../src/components';

import { useAppStore } from '../../src/stores/appStore';

export default function GamesScreen() {
  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);

  const reviewCard = useAppStore(s => s.reviewCard);

  const [mode, setMode] = useState<'menu' | 'quiz'>('menu');
  const [quizCards, setQuizCards] = useState<any[]>([]);
  const [allCardsPool, setAllCardsPool] = useState<any[]>([]);
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
    
    while (distractors.length < 3) {
      distractors.push(`Option ${distractors.length + 1}`);
    }
    
    return [correctWord, ...distractors].sort(() => 0.5 - Math.random());
  };

  const startQuiz = async () => {
    try {
      const { getAllCards } = await import('../../src/utils/database');
      const pool = await getAllCards();

      if (pool.length < 4) {
        alert("Not enough words to play!");
        return;
      }

      // Randomly pick 10 words from the entire pool
      const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
      
      setAllCardsPool(pool);
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
            options: generateOptions(quizCards[nextIndex].word, allCardsPool),
            showFeedback: false,
            selectedOption: null,
          };
        }
      });
    }, 1200);
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

        <Card style={styles.menuCard}>
          <Text style={styles.cardTitle}>Speed Quiz</Text>
          <Text style={styles.cardSubtitle}>Multiple choice vocabulary challenge</Text>
          <Button mode="contained" onPress={startQuiz} style={{ marginTop: 12 }}>
            Play now
          </Button>
        </Card>

        <Card style={[styles.menuCard, { opacity: 0.5 }]}>
          <Text style={styles.cardTitle}>Match & Listening</Text>
          <Text style={styles.cardSubtitle}>Coming in the next update</Text>
        </Card>
      </SafeAreaView>
    );
  }

  if (quizState.isFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Quiz Finished!</Text>
          <Card style={{ padding: 20, width: '100%', alignItems: 'center' }}>
            <Text style={styles.prompt}>Score: {quizState.score} / {quizState.totalQuestions}</Text>
            <Text style={styles.muted}>Accuracy: {Math.round((quizState.score / quizState.totalQuestions) * 100)}%</Text>
            <Button mode="contained" onPress={() => setMode('menu')} style={{ marginTop: 24, width: '100%' }}>
              Back to Menu
            </Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuizCard = quizCards[quizState.currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Button mode="text" onPress={() => setMode('menu')} style={{ marginVertical: 0 }}>← Back</Button>
        <Text style={styles.headerTitle}>Speed Quiz</Text>
        <View style={{ flex: 1 }} />
        <Button 
          mode="outlined" 
          onPress={() => setMode('menu')} 
          style={{ borderColor: '#ff6b6b', marginVertical: 0 }} 
          labelStyle={{ color: '#ff6b6b' }}
        >
          Forfeit
        </Button>
      </View>
      
      <View style={styles.quizInfo}>
        <Text style={styles.muted}>Question {quizState.currentQuestion + 1} of {quizState.totalQuestions}</Text>
        <Text style={styles.muted}>Streak: {quizState.streak}</Text>
      </View>

      <Card style={styles.quizCard}>
        <Text style={styles.label}>What is the word for:</Text>
        <Text style={styles.prompt}>
          {Array.isArray(currentQuizCard?.meanings) ? currentQuizCard.meanings[0] : String(currentQuizCard?.meanings)}
        </Text>

        <View style={{ gap: 8, marginTop: 24 }}>
          {quizState.options.map((option, index) => {
            const isSelected = quizState.selectedOption === option;
            const isCorrect = option === currentQuizCard.word;
            let buttonColor = '#1e1e1e';

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
                style={{ backgroundColor: buttonColor }}
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
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c', padding: 16 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  muted: { color: '#888', fontSize: 14, fontWeight: '600' },

  menuCard: { marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardSubtitle: { color: '#888', fontSize: 14, marginTop: 4 },

  quizInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  quizCard: { paddingVertical: 24 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  prompt: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 30, textAlign: 'center', marginTop: 12 },
  feedback: { fontWeight: '900', fontSize: 18, textAlign: 'center', marginTop: 20 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
