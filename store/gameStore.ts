import { create } from 'zustand';
import api from '../services/api';

export type GameMode = 'trivia' | 'photo_contest' | 'training' | 'breed_guess';

export interface GameSession {
  id: string;
  mode: GameMode;
  opponent?: {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  questions?: TriviaQuestion[];
  currentQuestion: number;
  myScore: number;
  opponentScore: number;
  status: 'waiting' | 'active' | 'finished';
  winner_id?: number;
}

export interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index?: number;
  answered?: number;
  time_limit: number;
}

export interface PhotoContest {
  id: number;
  title: string;
  description: string;
  end_at: string;
  entry_count: number;
  entries: ContestEntry[];
}

export interface ContestEntry {
  id: number;
  user_id: number;
  username: string;
  pet_name: string;
  pet_breed: string;
  media_url: string;
  votes: number;
  user_voted: boolean;
}

export interface TrainingChallenge {
  id: number;
  title: string;
  description: string;
  points_reward: number;
  streak_count: number;
  completed_today: boolean;
  completion_rate: number;
}

export interface BreedGuessEntry {
  id: number;
  media_url: string;
  actual_breed: string;
  options: string[];
  user_guess?: string;
  correct?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  points: number;
  score?: number;
}

interface GameState {
  currentSession: GameSession | null;
  activeContest: PhotoContest | null;
  challenges: TrainingChallenge[];
  breedGuesses: BreedGuessEntry[];
  leaderboard: LeaderboardEntry[];
  isMatchmaking: boolean;
  isLoadingGames: boolean;

  joinTriviaQueue: () => Promise<void>;
  leaveTriviaQueue: () => void;
  setSession: (session: GameSession) => void;
  updateSessionScore: (myScore: number, opponentScore: number) => void;
  endSession: (winnerId: number) => void;
  clearSession: () => void;

  fetchPhotoContest: () => Promise<void>;
  submitContestEntry: (form: FormData) => Promise<void>;
  voteContest: (entryId: number) => Promise<void>;

  fetchChallenges: () => Promise<void>;
  completeChallenge: (challengeId: number) => Promise<void>;

  fetchBreedGuesses: () => Promise<void>;
  submitBreedGuess: (entryId: number, guess: string) => Promise<boolean>;

  fetchLeaderboard: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentSession: null,
  activeContest: null,
  challenges: [],
  breedGuesses: [],
  leaderboard: [],
  isMatchmaking: false,
  isLoadingGames: false,

  joinTriviaQueue: async () => {
    set({ isMatchmaking: true });
    await api.post('/games/trivia/queue');
  },

  leaveTriviaQueue: () => {
    set({ isMatchmaking: false });
    api.delete('/games/trivia/queue').catch(() => {});
  },

  setSession: (session) => set({ currentSession: session, isMatchmaking: false }),

  updateSessionScore: (myScore, opponentScore) => {
    const session = get().currentSession;
    if (session) {
      set({ currentSession: { ...session, myScore, opponentScore } });
    }
  },

  endSession: (winnerId) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: { ...session, status: 'finished', winner_id: winnerId },
      });
    }
  },

  clearSession: () => set({ currentSession: null, isMatchmaking: false }),

  fetchPhotoContest: async () => {
    set({ isLoadingGames: true });
    try {
      const { data } = await api.get('/games/photo-contest/active');
      const contest = data.contest ?? {
        id: 1,
        title: 'Weekly Photo Contest',
        description: 'Upload your best pet photo and vote for your favorites.',
        end_at: '',
        entry_count: (data.entries ?? []).length,
        entries: data.entries ?? [],
      };
      set({ activeContest: contest });
    } finally {
      set({ isLoadingGames: false });
    }
  },

  submitContestEntry: async (form) => {
    await api.post('/games/photo-contest/enter', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await get().fetchPhotoContest();
  },

  voteContest: async (entryId) => {
    const contest = get().activeContest;
    if (!contest) return;
    set({
      activeContest: {
        ...contest,
        entries: contest.entries.map((e) =>
          e.id === entryId
            ? {
                ...e,
                user_voted: !e.user_voted,
                votes: e.votes + (e.user_voted ? -1 : 1),
              }
            : e
        ),
      },
    });
    await api.post(`/games/photo-contest/vote/${entryId}`);
  },

  fetchChallenges: async () => {
    const { data } = await api.get('/games/challenges');
    set({
      challenges: (data.challenges ?? []).map((challenge: any) => ({
        ...challenge,
        points_reward: Number(challenge.points_reward ?? challenge.points ?? 0),
        streak_count: Number(challenge.streak_count ?? 0),
        completion_rate: Number(challenge.completion_rate ?? 0),
        completed_today: Boolean(challenge.completed_today),
      })),
    });
  },

  completeChallenge: async (challengeId) => {
    await api.post(`/games/challenges/${challengeId}/complete`);
    set({
      challenges: get().challenges.map((c) =>
        c.id === challengeId ? { ...c, completed_today: true } : c
      ),
    });
  },

  fetchBreedGuesses: async () => {
    const { data } = await api.get('/games/breed-guess');
    set({
      breedGuesses: (data.entries ?? []).map((entry: any) => ({
        ...entry,
        options: entry.options ?? [],
      })),
    });
  },

  submitBreedGuess: async (entryId, guess) => {
    const { data } = await api.post(`/games/breed-guess/${entryId}`, { guess });
    set({
      breedGuesses: get().breedGuesses.map((e) =>
        e.id === entryId
          ? { ...e, user_guess: guess, correct: data.correct, actual_breed: data.actual_breed }
          : e
      ),
    });
    return data.correct;
  },

  fetchLeaderboard: async () => {
    const { data } = await api.get('/games/leaderboard');
    set({
      leaderboard: (data.leaderboard ?? []).map((entry: any) => ({
        ...entry,
        points: Number(entry.points ?? entry.score ?? 0),
        score: Number(entry.score ?? entry.points ?? 0),
      })),
    });
  },
}));
