"use client";

import { useEffect, useState, useCallback } from "react";
import { SEED_TEAMS, Team, Member, ROLE_ORDER } from "./teams";

const TEAMS_KEY = "sponge-study:teams:v1";
const SESSION_KEY = (id: number) => `sponge-study:session:${id}:v1`;

export type PresentationSession = {
  order: string[];
  index: number;
  feedback: Record<string, string>;
  timerEndsAt: number | null;
  paused: boolean;
  remainingMs: number;
  durationMs: number;
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function sortMembers(members: Member[]): Member[] {
  return [...members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role],
  );
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>(SEED_TEAMS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = safeRead<Team[] | null>(TEAMS_KEY, null);
    if (stored && Array.isArray(stored) && stored.length === 6) {
      setTeams(stored);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Team[]) => {
    setTeams(next);
    safeWrite(TEAMS_KEY, next);
  }, []);

  const updateTeam = useCallback(
    (id: number, mutator: (t: Team) => Team) => {
      setTeams((prev) => {
        const next = prev.map((t) => (t.id === id ? mutator(t) : t));
        safeWrite(TEAMS_KEY, next);
        return next;
      });
    },
    [],
  );

  const resetTeams = useCallback(() => {
    persist(SEED_TEAMS);
  }, [persist]);

  return { teams, hydrated, updateTeam, resetTeams };
}

export function useTeam(id: number) {
  const { teams, hydrated, updateTeam } = useTeams();
  const team = teams.find((t) => t.id === id);
  return { team, hydrated, updateTeam };
}

const EMPTY_SESSION: PresentationSession = {
  order: [],
  index: 0,
  feedback: {},
  timerEndsAt: null,
  paused: true,
  remainingMs: 8 * 60 * 1000,
  durationMs: 8 * 60 * 1000,
};

export function useSession(teamId: number) {
  const [session, setSession] = useState<PresentationSession>(EMPTY_SESSION);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = safeRead<PresentationSession | null>(
      SESSION_KEY(teamId),
      null,
    );
    if (stored) setSession(stored);
    setHydrated(true);
  }, [teamId]);

  const update = useCallback(
    (mutator: (s: PresentationSession) => PresentationSession) => {
      setSession((prev) => {
        const next = mutator(prev);
        safeWrite(SESSION_KEY(teamId), next);
        return next;
      });
    },
    [teamId],
  );

  const reset = useCallback(() => {
    setSession(EMPTY_SESSION);
    safeWrite(SESSION_KEY(teamId), EMPTY_SESSION);
  }, [teamId]);

  return { session, hydrated, update, reset };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function assignFeedback(
  order: string[],
): Record<string, string> {
  if (order.length < 2) {
    return Object.fromEntries(order.map((id) => [id, ""]));
  }
  // derangement attempt: shuffle until no presenter is their own feedbacker
  for (let tries = 0; tries < 50; tries++) {
    const candidates = shuffle(order);
    const ok = order.every((id, i) => candidates[i] !== id);
    if (ok) {
      return Object.fromEntries(order.map((id, i) => [id, candidates[i]]));
    }
  }
  // fallback: rotate by 1
  return Object.fromEntries(
    order.map((id, i) => [id, order[(i + 1) % order.length]]),
  );
}
