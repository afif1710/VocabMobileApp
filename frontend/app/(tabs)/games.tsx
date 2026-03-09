import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text as PaperText } from 'react-native-paper';
import { Button, Card } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAppStore } from '../../src/stores/appStore';
import * as Speech from 'expo-speech';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'menu' | 'quiz' | 'match' | 'listening';
type MatchItem = { id: string; text: string; state: 'idle' | 'selected' | 'matched' | 'mismatch' };

// ─── Shake helper ─────────────────────────────────────────────────────────────
function useShake() {
  const anim = useRef(new Animated.Value(0)).current;
  const shake = () => {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 8,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue: 6,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue: 0,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  };
  return { anim, shake };
}

// ─── Match Game Sub-component ─────────────────────────────────────────────────
function MatchGame({ cards, colors, onBack, onRestart }: {
  cards: any[];
  colors: any;
  onBack: () => void;
  onRestart: () => void;
}) {
  const reviewCard = useAppStore(s => s.reviewCard);
  const wordShakes = useRef<Record<string, { anim: Animated.Value; shake: () => void }>>({}).current;
  const meaningShakes = useRef<Record<string, { anim: Animated.Value; shake: () => void }>>({}).current;

  const [words, setWords]     = useState<MatchItem[]>(() =>
    cards.map(c => ({ id: String(c.id), text: c.word, state: 'idle' as const }))
         .sort(() => 0.5 - Math.random())
  );
  const [meanings, setMeanings] = useState<MatchItem[]>(() =>
    cards.map(c => ({
      id: String(c.id),
      text: Array.isArray(c.meanings) ? c.meanings[0] : String(c.meanings),
      state: 'idle' as const,
    })).sort(() => 0.5 - Math.random())
  );

  const [selectedWord,    setSelectedWord]    = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Ensure shake refs exist for every item
  [...words, ...meanings].forEach(item => {
    if (!wordShakes[item.id]) wordShakes[item.id] = (() => {
      const a = new Animated.Value(0);
      return { anim: a, shake: () => {
        a.setValue(0);
        Animated.sequence([
          Animated.timing(a, { toValue: 8,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: 6,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: -6, duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: 0,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
        ]).start();
      }};
    })();
    if (!meaningShakes[item.id]) meaningShakes[item.id] = (() => {
      const a = new Animated.Value(0);
      return { anim: a, shake: () => {
        a.setValue(0);
        Animated.sequence([
          Animated.timing(a, { toValue: 8,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: -8, duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: 6,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: -6, duration: 60, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(a, { toValue: 0,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
        ]).start();
      }};
    })();
  });

  useEffect(() => {
    if (!selectedWord || !selectedMeaning || locked) return;
    setLocked(true);

    if (selectedWord === selectedMeaning) {
      // ✅ Correct match
      setWords(prev => prev.map(w => w.id === selectedWord    ? { ...w, state: 'matched' } : w));
      setMeanings(prev => prev.map(m => m.id === selectedMeaning ? { ...m, state: 'matched' } : m));
      reviewCard({ id: selectedWord } as any, 'good');
      setSelectedWord(null);
      setSelectedMeaning(null);
      setLocked(false);
    } else {
      // ❌ Wrong — shake both
      wordShakes[selectedWord]?.shake();
      meaningShakes[selectedMeaning]?.shake();

      setWords(prev => prev.map(w => w.id === selectedWord    ? { ...w, state: 'mismatch' } : w));
      setMeanings(prev => prev.map(m => m.id === selectedMeaning ? { ...m, state: 'mismatch' } : m));
      reviewCard({ id: selectedWord } as any, 'again');

      setTimeout(() => {
        setWords(prev => prev.map(w => w.state === 'mismatch' ? { ...w, state: 'idle' } : w));
        setMeanings(prev => prev.map(m => m.state === 'mismatch' ? { ...m, state: 'idle' } : m));
        setSelectedWord(null);
        setSelectedMeaning(null);
        setLocked(false);
      }, 700);
    }
  }, [selectedWord, selectedMeaning]);

  const isDone = words.length > 0 && words.every(w => w.state === 'matched');
  const matchedCount = words.filter(w => w.state === 'matched').length;

  if (isDone) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <PaperText style={{ fontSize: 56 }}>🎉</PaperText>
          <PaperText style={[styles.title, { color: colors.textPrimary }]}>All Matched!</PaperText>
          <PaperText style={{ color: colors.muted }}>You matched all {words.length} pairs.</PaperText>
          <Button mode="contained" onPress={onRestart} style={{ marginTop: 24, minWidth: 180 }}>Play Again</Button>
          <Button mode="outlined" onPress={onBack} style={{ marginTop: 12, minWidth: 180 }}>Back to Menu</Button>
        </View>
      </SafeAreaView>
    );
  }

  const getWordColor = (w: MatchItem) => {
    if (w.state === 'matched')  return colors.successSoft;
    if (w.state === 'mismatch') return colors.dangerSoft;
    if (w.id === selectedWord)  return colors.primarySoft;
    return colors.surface;
  };
  const getMeanColor = (m: MatchItem) => {
    if (m.state === 'matched')    return colors.successSoft;
    if (m.state === 'mismatch')   return colors.dangerSoft;
    if (m.id === selectedMeaning) return colors.primarySoft;
    return colors.surfaceElevated;
  };
  const getWordBorder = (w: MatchItem) => {
    if (w.state === 'matched')  return colors.success;
    if (w.state === 'mismatch') return colors.danger;
    if (w.id === selectedWord)  return colors.primary;
    return colors.border;
  };
  const getMeanBorder = (m: MatchItem) => {
    if (m.state === 'matched')    return colors.success;
    if (m.state === 'mismatch')   return colors.danger;
    if (m.id === selectedMeaning) return colors.primary;
    return colors.border;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <PaperText style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>← Back</PaperText>
        </TouchableOpacity>
        <PaperText style={[styles.headerTitle, { color: colors.textPrimary }]}>Match Game</PaperText>
        <PaperText style={{ color: colors.muted, fontSize: 13 }}>{matchedCount}/{words.length}</PaperText>
      </View>

      <PaperText style={{ color: colors.muted, textAlign: 'center', marginBottom: 12, fontSize: 13 }}>
        Tap a word, then tap its meaning
      </PaperText>

      <View style={styles.matchBoard}>
        {/* Words column */}
        <View style={styles.matchColumn}>
          <PaperText style={[styles.columnLabel, { color: colors.textSecondary }]}>Words</PaperText>
          {words.map(w => (
            <Animated.View
              key={w.id}
              style={{ transform: [{ translateX: wordShakes[w.id]?.anim ?? 0 }] }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (locked || w.state === 'matched' || w.state === 'mismatch') return;
                  setSelectedWord(prev => prev === w.id ? null : w.id);
                }}
                style={[
                  styles.matchPill,
                  {
                    backgroundColor: getWordColor(w),
                    borderColor: getWordBorder(w),
                    opacity: w.state === 'matched' ? 0.4 : 1,
                  },
                ]}
              >
                <PaperText style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'center', fontSize: 13 }}>
                  {w.text}
                </PaperText>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Meanings column */}
        <View style={styles.matchColumn}>
          <PaperText style={[styles.columnLabel, { color: colors.textSecondary }]}>Meanings</PaperText>
          {meanings.map(m => (
            <Animated.View
              key={m.id}
              style={{ transform: [{ translateX: meaningShakes[m.id]?.anim ?? 0 }] }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (locked || m.state === 'matched' || m.state === 'mismatch') return;
                  setSelectedMeaning(prev => prev === m.id ? null : m.id);
                }}
                style={[
                  styles.matchPill,
                  {
                    backgroundColor: getMeanColor(m),
                    borderColor: getMeanBorder(m),
                    opacity: m.state === 'matched' ? 0.4 : 1,
                  },
                ]}
              >
                <PaperText style={{ color: colors.textPrimary, textAlign: 'center', fontSize: 12, lineHeight: 17 }}>
                  {m.text}
                </PaperText>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Main Games Screen ────────────────────────────────────────────────────────
export default function GamesScreen() {
  const { colors } = useTheme();
  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);
  const reviewCard = useAppStore(s => s.reviewCard);

  const [mode, setMode] = useState<Mode>('menu');
  const [quizCards, setQuizCards] = useState<any[]>([]);
  const [matchCards, setMatchCards] = useState<any[]>([]);
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
    while (distractors.length < 3) distractors.push(`Option ${distractors.length + 1}`);
    return [correctWord, ...distractors].sort(() => 0.5 - Math.random());
  };

  const loadPool = async () => {
    const { getAllCards } = await import('../../src/utils/database');
    return getAllCards();
  };

  const startQuiz = async () => {
    try {
      const pool = await loadPool();
      if (pool.length < 4) { alert('Need at least 4 words to play!'); return; }
      const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
      setAllCardsPool(pool);
      setQuizCards(selected);
      setQuizState({
        score: 0, currentQuestion: 0, totalQuestions: selected.length,
        options: generateOptions(selected[0].word, pool),
        isFinished: false, streak: 0, showFeedback: false,
        selectedOption: null, isCorrect: false,
      });
      setMode('quiz');
    } catch (e) { console.error(e); }
  };

  const startMatch = async () => {
    try {
      const pool = await loadPool();
      if (pool.length < 5) { alert('Need at least 5 words to play Match!'); return; }
      const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 6);
      setMatchCards(selected);
      setMode('match');
    } catch (e) { console.error(e); }
  };

  const startListening = async () => {
    try {
      const pool = await loadPool();
      if (pool.length < 4) { alert('Need at least 4 words to play Listening!'); return; }
      const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
      setAllCardsPool(pool);
      setQuizCards(selected);
      setQuizState({
        score: 0, currentQuestion: 0, totalQuestions: selected.length,
        options: generateOptions(selected[0].word, pool),
        isFinished: false, streak: 0, showFeedback: false,
        selectedOption: null, isCorrect: false,
      });
      setMode('listening');
      Speech.stop();
      Speech.speak(selected[0].word, { rate: 0.8 });
    } catch (e) { console.error(e); }
  };

  const handleOptionPress = async (option: string) => {
    if (quizState.showFeedback) return;
    const currentCard = quizCards[quizState.currentQuestion];
    const isCorrect = option === currentCard.word;
    setQuizState(prev => ({ ...prev, selectedOption: option, isCorrect, showFeedback: true, score: isCorrect ? prev.score + 1 : prev.score, streak: isCorrect ? prev.streak + 1 : 0 }));
    await reviewCard(currentCard, isCorrect ? 'good' : 'again');
    setTimeout(() => {
      setQuizState(prev => {
        if (prev.currentQuestion + 1 >= prev.totalQuestions) return { ...prev, isFinished: true, showFeedback: false };
        const nextIndex = prev.currentQuestion + 1;
        if (mode === 'listening') Speech.speak(quizCards[nextIndex].word, { rate: 0.8 });
        return { ...prev, currentQuestion: nextIndex, options: generateOptions(quizCards[nextIndex].word, allCardsPool), showFeedback: false, selectedOption: null };
      });
    }, 1200);
  };

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator animating color={colors.primary} />
          <PaperText style={{ color: colors.muted }}>Loading games…</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  // ── Match mode (separate component for hooks) ──
  if (mode === 'match') {
    return (
      <MatchGame
        cards={matchCards}
        colors={colors}
        onBack={() => setMode('menu')}
        onRestart={startMatch}
      />
    );
  }

  // ── Menu ──
  if (mode === 'menu') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <PaperText style={[styles.title, { color: colors.textPrimary }]}>Games</PaperText>
        <PaperText style={{ color: colors.muted, marginBottom: 16 }}>Quick vocabulary challenges</PaperText>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
          <Card style={styles.menuCard}>
            <PaperText style={[styles.cardTitle, { color: colors.textPrimary }]}>⚡ Speed Quiz</PaperText>
            <PaperText style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Multiple choice — pick the right word for the meaning.</PaperText>
            <Button mode="contained" onPress={startQuiz} style={{ marginTop: 14 }}>Play Now</Button>
          </Card>
          <Card style={styles.menuCard}>
            <PaperText style={[styles.cardTitle, { color: colors.textPrimary }]}>🔗 Match Game</PaperText>
            <PaperText style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Connect each word to its correct meaning. Wrong guesses shake!</PaperText>
            <Button mode="contained" onPress={startMatch} style={{ marginTop: 14 }}>Play Match</Button>
          </Card>
          <Card style={styles.menuCard}>
            <PaperText style={[styles.cardTitle, { color: colors.textPrimary }]}>🎧 Listening Quiz</PaperText>
            <PaperText style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Hear a word spoken aloud, then pick the correct one.</PaperText>
            <Button mode="contained" onPress={startListening} style={{ marginTop: 14 }}>Play Listening</Button>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Quiz Finished ──
  if (quizState.isFinished) {
    const pct = Math.round((quizState.score / quizState.totalQuestions) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪';
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <PaperText style={{ fontSize: 52 }}>{emoji}</PaperText>
          <PaperText style={[styles.title, { color: colors.textPrimary }]}>Quiz Finished!</PaperText>
          <Card style={{ padding: 24, width: '100%', alignItems: 'center' }}>
            <PaperText style={[styles.prompt, { color: colors.textPrimary }]}>{quizState.score} / {quizState.totalQuestions}</PaperText>
            <PaperText style={{ color: colors.muted, marginTop: 4 }}>Accuracy: {pct}%</PaperText>
            <Button mode="contained" onPress={() => setMode('menu')} style={{ marginTop: 20, width: '100%' }}>Back to Menu</Button>
            <Button mode="outlined" onPress={mode === 'listening' ? startListening : startQuiz} style={{ marginTop: 10, width: '100%' }}>Play Again</Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active Quiz / Listening ──
  const currentQuizCard = quizCards[quizState.currentQuestion];
  if (!currentQuizCard) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setMode('menu')} style={{ padding: 4 }}>
          <PaperText style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>← Back</PaperText>
        </TouchableOpacity>
        <PaperText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {mode === 'listening' ? '🎧 Listening' : '⚡ Speed Quiz'}
        </PaperText>
        <PaperText style={{ color: colors.muted, fontSize: 13 }}>
          {quizState.currentQuestion + 1}/{quizState.totalQuestions}
        </PaperText>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, {
          width: `${((quizState.currentQuestion) / quizState.totalQuestions) * 100}%`,
          backgroundColor: colors.primary,
        }]} />
      </View>

      <View style={[styles.quizInfo]}>
        <PaperText style={{ color: colors.muted }}>Streak 🔥 {quizState.streak}</PaperText>
        <PaperText style={{ color: colors.muted }}>Score: {quizState.score}</PaperText>
      </View>

      <Card style={styles.quizCard}>
        {mode === 'listening' ? (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <TouchableOpacity
              onPress={() => { Speech.stop(); Speech.speak(currentQuizCard.word, { rate: 0.8 }); }}
              style={[styles.playBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            >
              <PaperText style={{ color: colors.primary, fontSize: 32 }}>▶</PaperText>
            </TouchableOpacity>
            <PaperText style={{ color: colors.muted, marginTop: 12, fontSize: 13 }}>Tap to hear the word again</PaperText>
            <PaperText style={[styles.label, { marginTop: 16 }]}>Which word did you hear?</PaperText>
          </View>
        ) : (
          <>
            <PaperText style={styles.label}>What is the word for:</PaperText>
            <PaperText style={[styles.prompt, { color: colors.textPrimary }]}>
              {Array.isArray(currentQuizCard?.meanings) ? currentQuizCard.meanings[0] : String(currentQuizCard?.meanings)}
            </PaperText>
          </>
        )}

        <View style={{ gap: 10, marginTop: 20 }}>
          {quizState.options.map((option, index) => {
            const isSelected = quizState.selectedOption === option;
            const isRight    = option === currentQuizCard.word;
            let bg    = colors.surface;
            let label = colors.textPrimary;
            if (!quizState.showFeedback) { bg = colors.surfaceElevated; }
            else if (isRight)              { bg = colors.success;  label = '#fff'; }
            else if (isSelected && !isRight) { bg = colors.danger; label = '#fff'; }
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleOptionPress(option)}
                disabled={quizState.showFeedback}
                style={[styles.optionBtn, { backgroundColor: bg, borderColor: colors.border }]}
              >
                <PaperText style={{ color: label, fontWeight: '600', textAlign: 'center' }}>{option}</PaperText>
              </TouchableOpacity>
            );
          })}
        </View>

        {quizState.showFeedback && (
          <PaperText style={[styles.feedback, { color: quizState.isCorrect ? colors.success : colors.danger }]}>
            {quizState.isCorrect ? '✓ Correct!' : `✗ It's "${currentQuizCard.word}"`}
          </PaperText>
        )}
        {mode === 'listening' && quizState.showFeedback && (
          <PaperText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13 }}>
            Meaning: {Array.isArray(currentQuizCard?.meanings) ? currentQuizCard.meanings[0] : String(currentQuizCard?.meanings)}
          </PaperText>
        )}
      </Card>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, padding: 16 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header:      { marginBottom: 8 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  title:       { fontSize: 24, fontWeight: '900' },

  menuCard:    { marginBottom: 4 },
  cardTitle:   { fontSize: 17, fontWeight: '800' },
  cardSubtitle:{ fontSize: 13, marginTop: 4, lineHeight: 19 },

  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: '100%', borderRadius: 2 },

  quizInfo:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  quizCard:  { paddingVertical: 20 },
  label:     { color: '#999', fontSize: 12, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  prompt:    { fontSize: 22, fontWeight: '800', lineHeight: 30, textAlign: 'center', marginTop: 10 },
  feedback:  { fontWeight: '900', fontSize: 17, textAlign: 'center', marginTop: 18 },

  optionBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 12 },

  playBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  matchBoard:  { flexDirection: 'row', flex: 1, gap: 10 },
  matchColumn: { flex: 1, gap: 8 },
  columnLabel: { textAlign: 'center', fontWeight: '800', fontSize: 13, marginBottom: 4 },
  matchPill:   { borderRadius: 10, borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 10, minHeight: 52, justifyContent: 'center' },
});
