"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTeam, useSession } from "@/lib/store";

const formatMs = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function PresentPage({ params }: { params: { id: string } }) {
  const teamId = Number(params.id);
  const router = useRouter();
  const { team, hydrated } = useTeam(teamId);
  const { session, update: updateSession } = useSession(teamId);
  const [tick, setTick] = useState(0);
  const beepedRef = useRef(false);

  // tick every 250ms while running
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  const memberName = (id: string) => {
    if (!team) return id;
    return team.members.find((m) => m.id === id)?.name ?? id;
  };

  const remaining = useMemo(() => {
    if (session.paused || !session.timerEndsAt) return session.remainingMs;
    return Math.max(0, session.timerEndsAt - Date.now());
  }, [session, tick]);

  // play beep when timer hits zero
  useEffect(() => {
    if (!session.paused && session.timerEndsAt && remaining <= 0 && !beepedRef.current) {
      beepedRef.current = true;
      try {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const beep = (start: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = 880;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
          g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.45);
          o.start(ctx.currentTime + start);
          o.stop(ctx.currentTime + start + 0.5);
        };
        beep(0);
        beep(0.6);
        beep(1.2);
      } catch {}
      updateSession((s) => ({
        ...s,
        paused: true,
        remainingMs: 0,
        timerEndsAt: null,
      }));
    }
  }, [remaining, session.paused, session.timerEndsAt, updateSession]);

  if (!hydrated || !team) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-cream-100/60">불러오는 중…</p>
      </main>
    );
  }

  if (session.order.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-cream-50">
          진행 중인 발표 세션이 없습니다
        </h1>
        <p className="mb-6 text-cream-100/60">
          조 상세 페이지에서 ‘발표 순서 랜덤 생성’을 먼저 눌러주세요.
        </p>
        <Link href={`/team/${teamId}`} className="btn-gold">
          {team.id}조로 돌아가기
        </Link>
      </main>
    );
  }

  const presenterId = session.order[session.index];
  const nextId = session.order[session.index + 1];
  const feedbackerId = session.feedback[presenterId];
  const isLast = session.index === session.order.length - 1;
  const progress = 1 - remaining / session.durationMs;

  const startTimer = () => {
    beepedRef.current = false;
    updateSession((s) => ({
      ...s,
      paused: false,
      timerEndsAt: Date.now() + s.remainingMs,
    }));
  };
  const pauseTimer = () => {
    updateSession((s) => {
      if (s.paused || !s.timerEndsAt) return s;
      return {
        ...s,
        paused: true,
        remainingMs: Math.max(0, s.timerEndsAt - Date.now()),
        timerEndsAt: null,
      };
    });
  };
  const resetTimer = () => {
    beepedRef.current = false;
    updateSession((s) => ({
      ...s,
      paused: true,
      timerEndsAt: null,
      remainingMs: s.durationMs,
    }));
  };
  const goNext = () => {
    beepedRef.current = false;
    if (isLast) {
      router.push(`/team/${teamId}/vote`);
      return;
    }
    updateSession((s) => ({
      ...s,
      index: Math.min(s.order.length - 1, s.index + 1),
      paused: true,
      timerEndsAt: null,
      remainingMs: s.durationMs,
    }));
  };
  const goPrev = () => {
    beepedRef.current = false;
    updateSession((s) => ({
      ...s,
      index: Math.max(0, s.index - 1),
      paused: true,
      timerEndsAt: null,
      remainingMs: s.durationMs,
    }));
  };

  const timerColor =
    remaining <= 30_000
      ? "text-red-400"
      : remaining <= 90_000
      ? "text-gold-300"
      : "text-cream-50";

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 sm:py-10">
      <nav className="mb-4 flex items-center justify-between text-sm text-cream-100/50">
        <Link href={`/team/${teamId}`} className="hover:text-cream-100">
          ← {team.id}조
        </Link>
        <div className="flex items-center gap-3">
          <span className="chip-muted">
            {session.index + 1} / {session.order.length}
          </span>
          <Link
            href={`/team/${teamId}/vote`}
            className="text-cream-100/50 hover:text-gold-400"
          >
            MVP 투표 →
          </Link>
        </div>
      </nav>

      <section className="card p-6 sm:p-10">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold-400">
          지금 발표 중
        </div>
        <h1 className="text-4xl font-extrabold text-cream-50 sm:text-6xl">
          {memberName(presenterId)}
        </h1>

        <div className="mt-8 flex flex-col items-center">
          <div
            className={`tabular text-7xl font-extrabold leading-none sm:text-[8rem] ${timerColor}`}
          >
            {formatMs(remaining)}
          </div>
          <div className="mt-4 h-2 w-full max-w-xl overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-gold-500 transition-[width] duration-200"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {session.paused ? (
              <button onClick={startTimer} className="btn-gold">
                ▶ 시작
              </button>
            ) : (
              <button onClick={pauseTimer} className="btn-ghost">
                ⏸ 일시정지
              </button>
            )}
            <button onClick={resetTimer} className="btn-ghost">
              ↻ 리셋
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-cream-100/50">
            💬 피드백 담당
          </div>
          <div className="mt-2 text-2xl font-bold text-cream-50">
            {feedbackerId ? memberName(feedbackerId) : "—"}
          </div>
          <p className="mt-2 text-xs text-cream-100/50">
            발표가 끝나면 위 멤버가 가장 먼저 피드백을 남깁니다
          </p>
        </div>

        <div className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-cream-100/50">
            ⏭ 다음 발표자
          </div>
          <div className="mt-2 text-2xl font-bold text-cream-50">
            {nextId ? memberName(nextId) : "🏁 마지막 발표"}
          </div>
          <p className="mt-2 text-xs text-cream-100/50">
            {nextId ? `${session.index + 2}번째` : "발표가 모두 끝나면 MVP 투표로 이동"}
          </p>
        </div>
      </section>

      <section className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={session.index === 0}
          className="btn-ghost"
        >
          ← 이전
        </button>
        <button onClick={goNext} className="btn-gold flex-1 max-w-md">
          {isLast ? "🏆 발표 끝 · MVP 투표로 이동" : "다음 발표자 →"}
        </button>
      </section>

      <section className="card mt-6 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-cream-100/50">
          전체 순서
        </div>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {session.order.map((id, i) => {
            const isCurrent = i === session.index;
            const isDone = i < session.index;
            return (
              <li
                key={id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isCurrent
                    ? "border-gold-500 bg-gold-500/10 text-cream-50"
                    : isDone
                    ? "border-ink-700 bg-ink-800/30 text-cream-100/40 line-through"
                    : "border-ink-700 bg-ink-800/40 text-cream-100/80"
                }`}
              >
                <span className="tabular text-xs text-cream-100/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="truncate font-medium">{memberName(id)}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
