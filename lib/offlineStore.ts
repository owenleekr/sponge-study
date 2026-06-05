"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SEED_OFFLINE_TEAMS,
  OfflineTeam,
  OfflineMember,
  Day,
} from "./offlineTeams";

const TEAMS_KEY = "sponge-study:offline:teams:v2";
const SESSION_KEY = (id: string) => `sponge-study:offline:session:${id}:v1`;

export type RotationState = "idle" | "ready" | "running" | "complete";

export type RotationSession = {
  state: RotationState;
  durationMs: number;
  queue: string[]; // 남은 발표자 ID
  history: string[]; // 이미 발표한 ID 순서
  current: string | null;
  timerEndsAt: number | null;
  remainingMs: number;
  includeModerator: boolean;
};

export const DEFAULT_DURATION_MS = 60 * 1000; // 1분

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

// ───────────────────────── 팀 관리 ─────────────────────────

export function useOfflineTeams() {
  const [teams, setTeams] = useState<OfflineTeam[]>(SEED_OFFLINE_TEAMS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = safeRead<OfflineTeam[] | null>(TEAMS_KEY, null);
    if (stored && Array.isArray(stored)) setTeams(stored);
    setHydrated(true);
  }, []);

  const persist = useCallback((next: OfflineTeam[]) => {
    setTeams(next);
    safeWrite(TEAMS_KEY, next);
  }, []);

  const addTeam = useCallback(
    (day: Day, label: string, moderator: string) => {
      const id = `${day}-${Date.now().toString(36)}`;
      const team: OfflineTeam = {
        id,
        day,
        label:
          label.trim() ||
          `${day === "part1" ? "파트1" : "파트2"} · 새 조`,
        moderator: moderator.trim() || "모더레이터",
        members: [],
      };
      setTeams((prev) => {
        const next = [...prev, team];
        safeWrite(TEAMS_KEY, next);
        return next;
      });
      return id;
    },
    [],
  );

  const updateTeam = useCallback(
    (id: string, mutator: (t: OfflineTeam) => OfflineTeam) => {
      setTeams((prev) => {
        const next = prev.map((t) => (t.id === id ? mutator(t) : t));
        safeWrite(TEAMS_KEY, next);
        return next;
      });
    },
    [],
  );

  const deleteTeam = useCallback((id: string) => {
    setTeams((prev) => {
      const next = prev.filter((t) => t.id !== id);
      safeWrite(TEAMS_KEY, next);
      return next;
    });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(SESSION_KEY(id));
      } catch {}
    }
  }, []);

  const resetAll = useCallback(() => persist(SEED_OFFLINE_TEAMS), [persist]);

  return { teams, hydrated, addTeam, updateTeam, deleteTeam, resetAll };
}

export function useOfflineTeam(id: string) {
  const { teams, hydrated, updateTeam, deleteTeam } = useOfflineTeams();
  const team = teams.find((t) => t.id === id);
  return { team, hydrated, updateTeam, deleteTeam };
}

// ───────────────────────── 로테이션 세션 ─────────────────────────

const emptySession = (): RotationSession => ({
  state: "idle",
  durationMs: DEFAULT_DURATION_MS,
  queue: [],
  history: [],
  current: null,
  timerEndsAt: null,
  remainingMs: DEFAULT_DURATION_MS,
  includeModerator: true,
});

export function useRotation(teamId: string) {
  const [session, setSession] = useState<RotationSession>(emptySession());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = safeRead<RotationSession | null>(SESSION_KEY(teamId), null);
    if (stored) setSession(stored);
    setHydrated(true);
  }, [teamId]);

  const update = useCallback(
    (mutator: (s: RotationSession) => RotationSession) => {
      setSession((prev) => {
        const next = mutator(prev);
        safeWrite(SESSION_KEY(teamId), next);
        return next;
      });
    },
    [teamId],
  );

  const reset = useCallback(() => {
    const e = emptySession();
    setSession(e);
    safeWrite(SESSION_KEY(teamId), e);
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

// 팀에서 발표 후보 목록 (모더레이터 포함 여부에 따라)
export function eligibleSpeakers(
  team: OfflineTeam,
  includeModerator: boolean,
): { id: string; name: string }[] {
  const list: { id: string; name: string }[] = team.members.map((m) => ({
    id: m.id,
    name: m.name,
  }));
  if (includeModerator) {
    list.unshift({ id: `__mod__${team.moderator}`, name: team.moderator });
  }
  return list;
}
