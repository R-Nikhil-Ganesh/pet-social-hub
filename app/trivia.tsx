import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { TriviaGame } from '@/components/games/TriviaGame';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';

export default function TriviaScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const {
    currentSession: session,
    joinTriviaQueue,
    leaveTriviaQueue,
    setSession,
    setSessionQuestion,
    updateSessionScore,
    endSession,
  } = useGameStore();

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    socket.on('game:start', (data: any) => {
      setSession({
        id: data.session_id,
        mode: 'trivia',
        opponent: data.opponent,
        questions: data.questions,
        currentQuestion: data.current_question ?? 0,
        myScore: 0,
        opponentScore: 0,
        status: 'active',
        winner_id: null,
      });
    });

    socket.on('game:question', (data: { current_question: number }) => {
      setSessionQuestion(data.current_question);
    });

    socket.on('game:score', (data: { user_id: number; score: number }) => {
      const current = useGameStore.getState().currentSession;
      if (!current) return;
      if (data.user_id === user?.id) {
        updateSessionScore(data.score, current.opponentScore);
      } else {
        updateSessionScore(current.myScore, data.score);
      }
    });

    socket.on('game:end', (data: { winner_id: number | null }) => {
      endSession(data.winner_id);
    });

    // Join the matchmaking queue when screen mounts
    joinTriviaQueue();

    return () => {
      socket.off('game:start');
      socket.off('game:question');
      socket.off('game:score');
      socket.off('game:end');
      if (!useGameStore.getState().currentSession || useGameStore.getState().currentSession?.status === 'waiting') {
        leaveTriviaQueue();
      }
    };
  }, [token, user?.id, endSession, joinTriviaQueue, leaveTriviaQueue, setSession, setSessionQuestion, updateSessionScore]);

  const handleAnswer = (questionIndex: number, choiceIndex: number) => {
    if (!token || !session) return;
    const socket = getSocket(token);
    const question = session.questions?.[questionIndex];
    if (!question) return;

    socket.emit('game:answer', {
      session_id: session.id,
      question_index: questionIndex,
      choice_index: choiceIndex,
    });
  };

  const handleLeaveQueue = () => {
    if (!token) return;
    leaveTriviaQueue();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/games');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button when not in active session */}
      {session?.status !== 'active' && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeaveQueue} style={styles.backBtn}>
            <ThemedText style={styles.backBtnText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.title}>Pet Trivia</ThemedText>
          <View style={{ width: 70 }} />
        </View>
      )}
      <TriviaGame
        session={session ?? { id: 0, mode: 'trivia', status: 'waiting', questions: [], currentQuestion: 0, myScore: 0, opponentScore: 0, opponent: undefined, winner_id: null }}
        onAnswer={handleAnswer}
        onLeave={handleLeaveQueue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backBtnText: { fontSize: 15, color: '#7C3AED', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: '#18181B' },
});
