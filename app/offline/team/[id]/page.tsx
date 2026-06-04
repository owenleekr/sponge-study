"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useOfflineTeam,
  useRotation,
  shuffle,
  eligibleSpeakers,
} from "@/lib/offlineStore";

const formatMs = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const PRESETS = [
  { label: "30초", ms: 30_000 },
  { label: "1분", ms: 60_000 },
  { label: "2분", ms: 120_000 },
  { label: "3분", ms: 180_000 },
  { label: "5분", ms: 300_000 },
];

export default function OfflineTeamPage({
  params,
}: {
  params: { id: string };
}) {
  const teamId = params.id;
  const { team, hydrated, updateTeam, deleteTeam } = useOfflineTeam(teamId);
  const { session, update, reset } = useRotation(teamId);

  const [tick, setTick] = useState(0);
  const beepedRef = useRef(false);
  const [newName, setNewName] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editMod, setEditMod] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customSec, setCustomSec] = useState("");

  useEffect(() => {
    if (team) {
      setEditLabel(team.label);
      setEditMod(team.moderator);
    }
  }, [team?.id]); // only on team change

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    if (session.state !== "running" || !session.timerEndsAt)
      return session.remainingMs;
    return Math.max(0, session.timerEndsAt - Date.now());
  }, [session, tick]);

  // 타이머 0 도달 시: 다음 발표자 자동 선택
  useEffect(() => {
    if (
      session.state === "running" &&
      session.timerEndsAt &&
      remaining <= 0 &&
      !beepedRef.current
    ) {
      beepedRef.current = true;
      try {
        const Ctx = (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext) as typeof AudioContext;
        const ctx = new Ctx();
        const beep = (delay: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = 880;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
          g.gain.exponentialRampToValueAtTime(
            0.25,
            ctx.currentTime + delay + 0.02,
          );
          g.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + delay + 0.45,
          );
          o.start(ctx.currentTime + delay);
          o.stop(ctx.currentTime + delay + 0.5);
        };
        beep(0);
        beep(0.6);
        beep(1.2);
      } catch {}
      // advance: 큐에서 다음 발표자 pop
      update((s) => {
        const newHistory = s.current ? [...s.history, s.current] : s.history;
        if (s.queue.length === 0) {
          return {
            ...s,
            state: "complete",
            history: newHistory,
            current: null,
            timerEndsAt: null,
            remainingMs: 0,
            paused: true,
          } as typeof s;
        }
        const [next, ...rest] = s.queue;
        return {
          ...s,
          state: "ready",
          history: newHistory,
          current: next,
          queue: rest,
          timerEndsAt: null,
          remainingMs: s.durationMs,
        };
      });
    }
  }, [remaining, session.state, session.timerEndsAt, update]);

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-cream-100/60">불러오는 중…</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-cream-50">
          조를 찾을 수 없습니다
        </h1>
        <Link href="/offline" className="btn-gold mt-4">
          오프라인 홈으로
        </Link>
      </main>
    );
  }

  const allSpeakers = eligibleSpeakers(team, session.includeModerator);
  const currentName = session.current
    ? allSpeakers.find((s) => s.id === session.current)?.name ?? session.current
    : null;
  const nextPreview = session.queue[0];
  const nextName = nextPreview
    ? allSpeakers.find((s) => s.id === nextPreview)?.name ?? nextPreview
    : null;
  const progress =
    session.durationMs > 0 ? 1 - remaining / session.durationMs : 0;

  // ─── 컨트롤 ───
  const startRotation = () => {
    if (allSpeakers.length < 1) {
      alert("발표 후보가 없어요. 멤버를 추가해주세요.");
      return;
    }
    const queue = shuffle(allSpeakers.map((s) => s.id));
    const [first, ...rest] = queue;
    beepedRef.current = false;
    update((s) => ({
      ...s,
      state: "ready",
      queue: rest,
      history: [],
      current: first,
      timerEndsAt: null,
      remainingMs: s.durationMs,
    }));
  };

  const startTimer = () => {
    beepedRef.current = false;
    update((s) => ({
      ...s,
      state: "running",
      timerEndsAt: Date.now() + s.remainingMs,
    }));
  };

  const pauseTimer = () => {
    update((s) => {
      if (s.state !== "running" || !s.timerEndsAt) return s;
      return {
        ...s,
        state: "ready",
        remainingMs: Math.max(0, s.timerEndsAt - Date.now()),
        timerEndsAt: null,
      };
    });
  };

  const skipToNext = () => {
    beepedRef.current = false;
    update((s) => {
      const newHistory = s.current ? [...s.history, s.current] : s.history;
      if (s.queue.length === 0) {
        return {
          ...s,
          state: "complete",
          history: newHistory,
          current: null,
          timerEndsAt: null,
          remainingMs: 0,
        };
      }
      const [next, ...rest] = s.queue;
      return {
        ...s,
        state: "ready",
        history: newHistory,
        current: next,
        queue: rest,
        timerEndsAt: null,
        remainingMs: s.durationMs,
      };
    });
  };

  const resetAndReshuffle = () => {
    if (!window.confirm("로테이션을 처음부터 다시 시작할까요?")) return;
    beepedRef.current = false;
    reset();
  };

  const setDuration = (ms: number) => {
    update((s) => ({
      ...s,
      durationMs: ms,
      remainingMs:
        s.state === "running" || s.state === "ready" ? s.remainingMs : ms,
    }));
  };

  const applyCustomDuration = () => {
    const min = parseInt(customMin || "0", 10) || 0;
    const sec = parseInt(customSec || "0", 10) || 0;
    const ms = (min * 60 + sec) * 1000;
    if (ms < 5_000) {
      alert("최소 5초 이상으로 설정해주세요.");
      return;
    }
    setDuration(ms);
    setCustomMin("");
    setCustomSec("");
  };

  // ─── 멤버 편집 ───
  const addMember = () => {
    const n = newName.trim();
    if (!n) return;
    if (team.members.some((m) => m.name === n) || team.moderator === n) {
      alert("이미 같은 이름이 있습니다.");
      return;
    }
    updateTeam(teamId, (t) => ({
      ...t,
      members: [...t.members, { id: n, name: n }],
    }));
    setNewName("");
  };

  const removeMember = (id: string) => {
    if (!window.confirm("이 멤버를 삭제할까요?")) return;
    updateTeam(teamId, (t) => ({
      ...t,
      members: t.members.filter((m) => m.id !== id),
    }));
  };

  const saveTeamInfo = () => {
    updateTeam(teamId, (t) => ({
      ...t,
      label: editLabel.trim() || t.label,
      moderator: editMod.trim() || t.moderator,
    }));
    setShowSettings(false);
  };

  const handleDeleteTeam = () => {
    if (!window.confirm(`'${team.label}' 조를 영구 삭제할까요?`)) return;
    deleteTeam(teamId);
    window.location.href = "/offline";
  };

  const timerColor =
    remaining <= 5_000
      ? "text-red-400"
      : remaining <= 15_000
      ? "text-gold-300"
      : "text-cream-50";

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 sm:py-10">
      <nav className="mb-4 flex items-center justify-between text-sm text-cream-100/50">
        <Link href="/offline" className="hover:text-cream-100">
          ← 오프라인 모임
        </Link>
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="text-cream-100/50 hover:text-gold-400"
        >
          ⚙ 조 설정
        </button>
      </nav>

      <header className="mb-4">
        <div className="text-xs font-semibold tracking-widest text-gold-400">
          {team.label}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-cream-50">
          🎙 {team.moderator}
        </h1>
      </header>

      {showSettings && (
        <section className="card mb-5 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
                조 이름
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-cream-50 outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
                모더레이터
              </label>
              <input
                type="text"
                value={editMod}
                onChange={(e) => setEditMod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-cream-50 outline-none focus:border-gold-500"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={handleDeleteTeam} className="text-xs text-red-400 underline-offset-4 hover:underline">
              조 삭제
            </button>
            <button onClick={saveTeamInfo} className="btn-gold text-sm">
              저장
            </button>
          </div>
        </section>
      )}

      {/* ─── 타이머 영역 ─── */}
      <section className="card p-6 sm:p-8">
        {session.state === "idle" && (
          <div className="text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-cream-100/40">
              발표 시간
            </div>
            <div className="tabular text-5xl font-extrabold text-cream-50 sm:text-6xl">
              {formatMs(session.durationMs)}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setDuration(p.ms)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    session.durationMs === p.ms
                      ? "bg-gold-500 text-ink-950 font-bold"
                      : "border border-ink-600 text-cream-100/70 hover:border-gold-500/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-cream-100/50">
              <span>커스텀:</span>
              <input
                type="number"
                min="0"
                placeholder="분"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-16 rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-center text-sm text-cream-50 outline-none focus:border-gold-500"
              />
              <span>분</span>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="초"
                value={customSec}
                onChange={(e) => setCustomSec(e.target.value)}
                className="w-16 rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-center text-sm text-cream-50 outline-none focus:border-gold-500"
              />
              <span>초</span>
              <button
                onClick={applyCustomDuration}
                className="rounded-md border border-ink-600 px-2 py-1 text-cream-100 hover:border-gold-500/50"
              >
                적용
              </button>
            </div>

            <label className="mt-5 inline-flex items-center gap-2 text-sm text-cream-100/70">
              <input
                type="checkbox"
                checked={session.includeModerator}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    includeModerator: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-gold-500"
              />
              모더레이터도 발표에 포함
            </label>

            <button
              type="button"
              onClick={startRotation}
              className="btn-gold mt-6 w-full text-lg"
            >
              🎲 로테이션 시작
            </button>
            <p className="mt-2 text-xs text-cream-100/40">
              발표자 {allSpeakers.length}명 · 랜덤 순서로 진행
            </p>
          </div>
        )}

        {(session.state === "ready" || session.state === "running") && (
          <div className="text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-400">
              지금 발표
            </div>
            <h2 className="text-4xl font-extrabold text-cream-50 sm:text-5xl">
              {currentName}
            </h2>

            <div className={`mt-6 tabular text-6xl font-extrabold leading-none sm:text-8xl ${timerColor}`}>
              {formatMs(remaining)}
            </div>

            <div className="mx-auto mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gold-500 transition-[width] duration-200"
                style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {session.state === "running" ? (
                <button onClick={pauseTimer} className="btn-ghost">
                  ⏸ 일시정지
                </button>
              ) : (
                <button onClick={startTimer} className="btn-gold text-lg">
                  ▶ 시작
                </button>
              )}
              <button onClick={skipToNext} className="btn-ghost">
                다음 ⏭
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-ink-700 bg-ink-800/40 p-3">
                <div className="text-xs uppercase tracking-wider text-cream-100/50">
                  다음
                </div>
                <div className="mt-1 truncate font-semibold text-cream-50">
                  {nextName ?? "🏁 마지막 발표"}
                </div>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800/40 p-3">
                <div className="text-xs uppercase tracking-wider text-cream-100/50">
                  진행
                </div>
                <div className="mt-1 font-semibold text-cream-50">
                  {session.history.length + 1} / {allSpeakers.length}
                </div>
              </div>
            </div>

            <button
              onClick={resetAndReshuffle}
              className="mt-5 text-xs text-cream-100/40 underline-offset-4 hover:text-cream-100 hover:underline"
            >
              로테이션 처음부터 다시
            </button>
          </div>
        )}

        {session.state === "complete" && (
          <div className="text-center">
            <div className="text-4xl">🏁</div>
            <h2 className="mt-2 text-2xl font-bold text-cream-50">
              모두 발표 완료!
            </h2>
            <p className="mt-1 text-sm text-cream-100/60">
              {session.history.length}명 · 한 바퀴 끝
            </p>
            <button
              onClick={resetAndReshuffle}
              className="btn-gold mt-5"
            >
              🔁 다시 시작 (재셔플)
            </button>
          </div>
        )}
      </section>

      {/* ─── 발표 기록 ─── */}
      {session.history.length > 0 && (
        <section className="card mt-5 p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-cream-100/50">
            발표 완료 ({session.history.length}명)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.history.map((id, i) => {
              const n = allSpeakers.find((s) => s.id === id)?.name ?? id;
              return (
                <span
                  key={`${id}-${i}`}
                  className="inline-flex items-center gap-1 rounded-md bg-ink-800/60 px-2 py-1 text-xs text-cream-100/70"
                >
                  <span className="text-cream-100/40">{i + 1}.</span> {n}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 멤버 명단 (편집) ─── */}
      <section className="card mt-5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-cream-50">
            조원 명단 ({team.members.length}명 + 모더레이터 1)
          </h3>
        </div>

        <ul className="space-y-1.5">
          <li className="flex items-center justify-between rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2">
            <span className="text-sm font-medium text-cream-50">
              🎙 {team.moderator}{" "}
              <span className="text-xs text-gold-400">모더레이터</span>
            </span>
          </li>
          {team.members.map((mem) => (
            <li
              key={mem.id}
              className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2"
            >
              <span className="text-sm text-cream-50">{mem.name}</span>
              <button
                onClick={() => removeMember(mem.id)}
                className="rounded-md border border-ink-700 px-2 py-0.5 text-[10px] text-cream-100/40 hover:border-red-500/50 hover:text-red-400"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="이름(닉네임)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addMember();
            }}
            className="flex-1 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-cream-50 outline-none focus:border-gold-500"
          />
          <button onClick={addMember} className="btn-ghost text-sm">
            추가
          </button>
        </div>
      </section>
    </main>
  );
}
