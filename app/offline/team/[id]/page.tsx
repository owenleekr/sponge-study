"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useOfflineTeam,
  useRotation,
  shuffle,
  eligibleSpeakers,
} from "@/lib/offlineStore";
import { PART_HEADLINE, PART_TOPICS } from "@/lib/offlineTeams";

const formatMs = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

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
  const [focusMode, setFocusMode] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customSec, setCustomSec] = useState("");

  useEffect(() => {
    if (team) {
      setEditLabel(team.label);
      setEditMod(team.moderator);
    }
  }, [team?.id]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    if (session.state !== "running" || !session.timerEndsAt)
      return session.remainingMs;
    return Math.max(0, session.timerEndsAt - Date.now());
  }, [session, tick]);

  // 타이머 0 도달: revealing 상태로 전환 (다음 발표자는 아직 노출 안 함)
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
      update((s) => ({
        ...s,
        state: "revealing",
        timerEndsAt: null,
        remainingMs: 0,
      }));
    }
  }, [remaining, session.state, session.timerEndsAt, update]);

  // ESC로 집중모드 종료
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const topics = PART_TOPICS[team.day];
  const partHeader = PART_HEADLINE[team.day];
  const topicIdx = Math.min(session.topicIndex, topics.length - 1);
  const topic = topics[topicIdx];
  const allSpeakers = eligibleSpeakers(team, session.includeModerator);
  const currentName = session.current
    ? allSpeakers.find((s) => s.id === session.current)?.name ?? session.current
    : null;
  const progress =
    session.durationMs > 0 ? 1 - remaining / session.durationMs : 0;

  // ─── 컨트롤 ───
  const startRotationForTopic = (idx: number) => {
    if (allSpeakers.length < 1) {
      alert("발표 후보가 없어요. 멤버를 추가해주세요.");
      return;
    }
    const t = topics[idx];
    const duration = t.perPersonSec * 1000;
    const queue = shuffle(allSpeakers.map((s) => s.id));
    const [first, ...rest] = queue;
    beepedRef.current = false;
    update((s) => ({
      ...s,
      state: "ready",
      durationMs: duration,
      remainingMs: duration,
      queue: rest,
      history: [],
      current: first,
      timerEndsAt: null,
      topicIndex: idx,
    }));
  };

  const switchTopic = (idx: number) => {
    if (idx === session.topicIndex && session.state !== "idle") return;
    if (
      (session.state === "running" || session.state === "revealing") &&
      !window.confirm(
        "주제를 바꾸면 현재 로테이션이 초기화됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    startRotationForTopic(idx);
  };

  const startRotation = () => startRotationForTopic(session.topicIndex);

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

  const revealNext = () => {
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

  const skipManually = () => {
    if (!window.confirm("현재 발표자를 건너뛸까요?")) return;
    revealNext();
  };

  const resetAndReshuffle = () => {
    if (!window.confirm("로테이션을 처음부터 다시 시작할까요?")) return;
    beepedRef.current = false;
    reset();
  };

  // 멤버 편집
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

  const toggleFocus = async () => {
    const next = !focusMode;
    setFocusMode(next);
    try {
      if (next && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}
  };

  const timerColor =
    remaining <= 5_000
      ? "text-red-400"
      : remaining <= 15_000
      ? "text-gold-300"
      : "text-cream-50";

  // ═════════════════════ 집중 모드 ═════════════════════
  if (focusMode) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950 px-6">
        <button
          onClick={toggleFocus}
          className="absolute right-5 top-5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-cream-100/60 hover:border-gold-500 hover:text-gold-400"
        >
          ⛶ 종료 (ESC)
        </button>

        <div className="mb-4 text-center text-xs font-semibold tracking-widest text-gold-400 sm:text-base">
          {partHeader.tag} · {team.label}
        </div>

        <div className="mb-2 text-center text-2xl font-extrabold text-cream-50 sm:text-4xl md:text-5xl">
          {topic.title}
        </div>
        <div className="mb-10 max-w-3xl text-center text-sm text-cream-100/70 sm:text-lg">
          {topic.subtitle}
        </div>

        {session.state === "idle" && (
          <div className="text-center">
            <div className="mb-6 tabular text-7xl font-extrabold text-cream-50 sm:text-9xl">
              {formatMs(topic.perPersonSec * 1000)}
            </div>
            <button onClick={startRotation} className="btn-gold text-xl">
              🎲 로테이션 시작
            </button>
          </div>
        )}

        {(session.state === "ready" || session.state === "running") && (
          <div className="w-full max-w-4xl text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-400 sm:text-sm">
              지금 발표
            </div>
            <h1 className="mb-6 text-6xl font-extrabold text-cream-50 sm:text-8xl md:text-9xl">
              {currentName}
            </h1>
            <div
              className={`tabular text-8xl font-extrabold leading-none sm:text-[12rem] ${timerColor}`}
            >
              {formatMs(remaining)}
            </div>
            <div className="mx-auto mt-6 h-3 w-full max-w-xl overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gold-500 transition-[width] duration-200"
                style={{
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                }}
              />
            </div>
            <div className="mt-8 flex justify-center gap-3">
              {session.state === "running" ? (
                <button onClick={pauseTimer} className="btn-ghost text-lg">
                  ⏸ 일시정지
                </button>
              ) : (
                <button onClick={startTimer} className="btn-gold text-2xl px-10 py-5">
                  ▶ 시작
                </button>
              )}
            </div>
            <div className="mt-5 text-sm text-cream-100/50">
              {session.history.length + 1} / {allSpeakers.length}
            </div>
          </div>
        )}

        {session.state === "revealing" && (
          <div className="text-center">
            <div className="mb-3 text-5xl">⏰</div>
            <div className="mb-6 text-3xl font-bold text-gold-300 sm:text-4xl">
              시간 종료
            </div>
            <button
              onClick={revealNext}
              className="btn-gold text-2xl px-10 py-5"
            >
              🎁 다음 발표자 공개
            </button>
            <div className="mt-6 text-sm text-cream-100/50">
              남은 사람 {session.queue.length}명
            </div>
          </div>
        )}

        {session.state === "complete" && (
          <div className="text-center">
            <div className="text-7xl sm:text-9xl">🏁</div>
            <h2 className="mt-4 text-3xl font-bold text-cream-50 sm:text-5xl">
              모두 발표 완료
            </h2>
            <p className="mt-2 text-cream-100/60">
              {session.history.length}명 · {topic.title}
            </p>
            <button onClick={resetAndReshuffle} className="btn-gold mt-6 text-lg">
              🔁 다시 시작
            </button>
          </div>
        )}
      </main>
    );
  }

  // ═════════════════════ 일반 모드 ═════════════════════
  return (
    <main className="mx-auto max-w-3xl px-5 py-6 sm:py-10">
      <nav className="mb-4 flex items-center justify-between text-sm text-cream-100/50">
        <Link href="/offline" className="hover:text-cream-100">
          ← 오프라인 모임
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFocus}
            className="text-cream-100/50 hover:text-gold-400"
            title="집중 모드 (발표용)"
          >
            ⛶ 집중 모드
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-cream-100/50 hover:text-gold-400"
          >
            ⚙ 조 설정
          </button>
        </div>
      </nav>

      <header className="mb-4">
        <div className="text-xs font-semibold tracking-widest text-gold-400">
          {partHeader.tag} · {partHeader.title}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xs text-cream-100/50">{team.label}</span>
          <h1 className="text-2xl font-bold text-cream-50">
            🎙 {team.moderator}
          </h1>
        </div>
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
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-cream-100/70">
            <input
              type="checkbox"
              checked={session.includeModerator}
              onChange={(e) =>
                update((s) => ({ ...s, includeModerator: e.target.checked }))
              }
              className="h-4 w-4 accent-gold-500"
            />
            모더레이터도 발표에 포함
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={handleDeleteTeam}
              className="text-xs text-red-400 underline-offset-4 hover:underline"
            >
              조 삭제
            </button>
            <button onClick={saveTeamInfo} className="btn-gold text-sm">
              저장
            </button>
          </div>
        </section>
      )}

      {/* ─── 주제 선택 탭 ─── */}
      <section className="mb-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream-100/50">
          주제 ({topics.length}개)
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {topics.map((t, i) => {
            const isActive = i === topicIdx;
            const isDone = i < topicIdx && session.state === "complete";
            return (
              <button
                key={t.title}
                onClick={() => switchTopic(i)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                  isActive
                    ? "border-gold-500 bg-gold-500/10 text-cream-50"
                    : isDone
                    ? "border-ink-700 bg-ink-800/40 text-cream-100/40"
                    : "border-ink-700 bg-ink-800/40 text-cream-100/80 hover:border-gold-500/50"
                }`}
              >
                <div className="font-bold">
                  {i + 1}. {t.title}
                </div>
                <div className="mt-0.5 text-[10px] text-cream-100/50">
                  {t.totalMin}분 · {t.perPersonSec}초/인
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── 메인 타이머 영역 ─── */}
      <section className="card p-6 sm:p-8">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold-400">
          주제 {topicIdx + 1} / {topics.length}
        </div>
        <h2 className="text-2xl font-extrabold text-cream-50 sm:text-3xl">
          {topic.title}
        </h2>
        <p className="mt-1 text-sm text-cream-100/70">{topic.subtitle}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          <span className="chip-muted">전체 {topic.totalMin}분</span>
          <span className="chip">인당 {topic.perPersonSec}초</span>
        </div>

        <div className="mt-6">
          {session.state === "idle" && (
            <div className="text-center">
              <div className="tabular text-5xl font-extrabold text-cream-50 sm:text-6xl">
                {formatMs(topic.perPersonSec * 1000)}
              </div>
              <button
                onClick={startRotation}
                className="btn-gold mt-5 w-full text-lg"
              >
                🎲 로테이션 시작
              </button>
              <p className="mt-2 text-xs text-cream-100/40">
                발표자 {allSpeakers.length}명 · 랜덤 순서 · 인당{" "}
                {topic.perPersonSec}초
              </p>
            </div>
          )}

          {(session.state === "ready" || session.state === "running") && (
            <div className="text-center">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-400">
                지금 발표
              </div>
              <h3 className="text-4xl font-extrabold text-cream-50 sm:text-5xl">
                {currentName}
              </h3>

              <div
                className={`mt-6 tabular text-6xl font-extrabold leading-none sm:text-8xl ${timerColor}`}
              >
                {formatMs(remaining)}
              </div>

              <div className="mx-auto mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-gold-500 transition-[width] duration-200"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                  }}
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
                <button onClick={skipManually} className="btn-ghost text-sm">
                  건너뛰기
                </button>
              </div>

              <div className="mt-5 text-sm text-cream-100/60">
                진행 {session.history.length + 1} / {allSpeakers.length}
              </div>
            </div>
          )}

          {session.state === "revealing" && (
            <div className="text-center">
              <div className="mb-3 text-4xl">⏰</div>
              <div className="mb-5 text-xl font-bold text-gold-300 sm:text-2xl">
                시간 종료
              </div>
              <button
                onClick={revealNext}
                className="btn-gold w-full text-lg"
              >
                🎁 다음 발표자 공개
              </button>
              <div className="mt-3 text-xs text-cream-100/40">
                남은 사람 {session.queue.length}명
              </div>
            </div>
          )}

          {session.state === "complete" && (
            <div className="text-center">
              <div className="text-5xl">🏁</div>
              <h3 className="mt-3 text-2xl font-bold text-cream-50">
                {topic.title} 발표 완료
              </h3>
              <p className="mt-1 text-sm text-cream-100/60">
                {session.history.length}명 한 바퀴 완주
              </p>
              <div className="mt-5 flex flex-col items-center gap-2">
                {topicIdx < topics.length - 1 && (
                  <button
                    onClick={() => switchTopic(topicIdx + 1)}
                    className="btn-gold w-full"
                  >
                    다음 주제로 →{" "}
                    <span className="opacity-80">
                      {topics[topicIdx + 1].title}
                    </span>
                  </button>
                )}
                <button
                  onClick={resetAndReshuffle}
                  className="btn-ghost text-sm"
                >
                  🔁 같은 주제 다시
                </button>
              </div>
            </div>
          )}
        </div>
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
          {!showSettings && (
            <label className="inline-flex items-center gap-1.5 text-[11px] text-cream-100/60">
              <input
                type="checkbox"
                checked={session.includeModerator}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    includeModerator: e.target.checked,
                  }))
                }
                className="h-3 w-3 accent-gold-500"
              />
              모더레이터 발표 포함
            </label>
          )}
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
