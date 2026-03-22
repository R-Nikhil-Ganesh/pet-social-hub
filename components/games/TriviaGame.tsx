import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { GameSession, TriviaQuestion } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

interface TriviaGameProps {
  session: GameSession;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  onLeave: () => void;
}

export function TriviaGame({ session, onAnswer, onLeave }: TriviaGameProps) {
  const user = useAuthStore((s) => s.user);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answered, setAnswered] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const question: TriviaQuestion | undefined =
    session.questions?.[session.currentQuestion];

  useEffect(() => {
    setAnswered(null);
    setTimeLeft(question?.time_limit ?? 20);
    progressAnim.setValue(1);

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: (question?.time_limit ?? 20) * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session.currentQuestion]);

  const handleAnswer = (index: number) => {
    if (answered !== null || !question) return;
    setAnswered(index);
    if (timerRef.current) clearInterval(timerRef.current);
    onAnswer(session.currentQuestion, index);
  };

  if (session.status === 'waiting') {
    return (
      <View style={styles.waitingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <ThemedText style={styles.waitingText}>Finding opponent…</ThemedText>
        <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}>
          <ThemedText style={styles.leaveBtnText}>Leave Queue</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (session.status === 'finished') {
    const won = session.winner_id === user?.id;
    return (
      <View style={styles.finishedContainer}>
        <Ionicons name={won ? 'trophy' : 'close-circle-outline'} size={48} color={won ? '#EAB308' : '#A1A1AA'} />
        <ThemedText style={styles.resultTitle}>{won ? 'You Won!' : 'Better Luck Next Time'}</ThemedText>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBlock}>
            <ThemedText style={styles.scoreLabel}>You</ThemedText>
            <ThemedText style={styles.scoreValue}>{session.myScore}</ThemedText>
          </View>
          <ThemedText style={styles.scoreSep}>vs</ThemedText>
          <View style={styles.scoreBlock}>
            <ThemedText style={styles.scoreLabel}>
              {session.opponent?.display_name ?? 'Opponent'}
            </ThemedText>
            <ThemedText style={styles.scoreValue}>{session.opponentScore}</ThemedText>
          </View>
        </View>
        {won && <PointsBadge points={100} size="lg" showLabel />}
        <TouchableOpacity style={styles.doneBtn} onPress={onLeave}>
          <ThemedText style={styles.doneBtnText}>Done</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.playerInfo}>
          <Avatar uri={user?.avatar_url} size={36} />
          <View>
            <ThemedText style={styles.playerName}>You</ThemedText>
            <ThemedText style={styles.playerScore}>{session.myScore} pts</ThemedText>
          </View>
        </View>
        <View style={styles.vsBox}>
          <ThemedText style={styles.vsText}>VS</ThemedText>
          <ThemedText style={styles.questionCount}>
            Q{session.currentQuestion + 1}/{session.questions?.length ?? 10}
          </ThemedText>
        </View>
        <View style={[styles.playerInfo, styles.playerInfoRight]}>
          <View style={{ alignItems: 'flex-end' }}>
            <ThemedText style={styles.playerName}>
              {session.opponent?.display_name ?? '...'}
            </ThemedText>
            <ThemedText style={styles.playerScore}>{session.opponentScore} pts</ThemedText>
          </View>
          <Avatar uri={session.opponent?.avatar_url} size={36} />
        </View>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <Animated.View
          style={[
            styles.timerBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: timeLeft <= 5 ? '#EF4444' : '#7C3AED',
            },
          ]}
        />
      </View>
      <ThemedText style={[styles.timerText, timeLeft <= 5 && styles.timerUrgent]}>
        {timeLeft}s
      </ThemedText>

      {/* Question */}
      {question && (
        <View style={styles.questionSection}>
          <ThemedText style={styles.questionText}>{question.question}</ThemedText>
          <View style={styles.options}>
            {question.options.map((option, index) => {
              let btnStyle = styles.optionBtn;
              if (answered !== null) {
                if (index === question.correct_index) {
                  btnStyle = { ...btnStyle, ...styles.optionCorrect } as typeof btnStyle;
                } else if (index === answered && answered !== question.correct_index) {
                  btnStyle = { ...btnStyle, ...styles.optionWrong } as typeof btnStyle;
                }
              } else if (index === answered) {
                btnStyle = { ...btnStyle, ...styles.optionSelected } as typeof btnStyle;
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={btnStyle}
                  onPress={() => handleAnswer(index)}
                  disabled={answered !== null || timeLeft <= 0}
                >
                  <ThemedText style={styles.optionLabel}>
                    {String.fromCharCode(65 + index)}.
                  </ThemedText>
                  <ThemedText style={styles.optionText}>{option}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  waitingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#52525B',
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  resultEmoji: {
    fontSize: 64,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#18181B',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginVertical: 8,
  },
  scoreBlock: {
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#71717A',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#7C3AED',
  },
  scoreSep: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  doneBtn: {
    marginTop: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  playerInfoRight: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  playerScore: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '700',
  },
  vsBox: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A1A1AA',
  },
  questionCount: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  timerContainer: {
    height: 5,
    backgroundColor: '#E4E4E7',
  },
  timerBar: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    textAlign: 'right',
    paddingRight: 16,
    paddingTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#52525B',
  },
  timerUrgent: {
    color: '#EF4444',
  },
  questionSection: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
    lineHeight: 26,
    textAlign: 'center',
  },
  options: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
    width: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#27272A',
    lineHeight: 20,
  },
  leaveBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  leaveBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
