"use client";

import Link from "next/link";
import { useTeams } from "@/lib/store";

export default function HomePage() {
  const { teams, hydrated, resetTeams } = useTeams();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <header className="mb-10 text-center">
        <div className="mb-2 flex items-center justify-center gap-3 text-3xl sm:text-4xl">
          <span className="text-3xl">🧽</span>
          <h1 className="font-extrabold tracking-tight text-cream-50">
            Sponge Club 1기 · 스터디 운영
          </h1>
        </div>
        <p className="text-sm text-cream-100/70 sm:text-base">
          조 선택 → 발표 순서 랜덤 · 8분 타이머 · 피드백 담당자 · MVP 투표
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-cream-100/60">
          <span className="chip-muted">6개 조</span>
          <span className="chip-muted">총 77명</span>
          <span className="chip-muted">5/3 첫 만남</span>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/team/${team.id}`}
            className="card group block p-5 transition hover:border-gold-500/60 hover:shadow-gold"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold tracking-widest text-gold-400">
                  {team.id}조
                </div>
                <div className="mt-1 text-2xl font-bold text-cream-50">
                  조장 {team.leaderName}
                </div>
              </div>
              <span className="chip">{team.members.length}명</span>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-cream-100/70">
              {team.theme}
            </p>

            <div className="-m-0.5 flex flex-wrap gap-1.5">
              {team.members.slice(0, 8).map((m) => (
                <span
                  key={m.id}
                  className="m-0.5 inline-block rounded-md bg-ink-700/60 px-2 py-0.5 text-[11px] text-cream-100/80"
                >
                  {m.name}
                </span>
              ))}
              {team.members.length > 8 && (
                <span className="m-0.5 inline-block rounded-md bg-ink-700/30 px-2 py-0.5 text-[11px] text-cream-100/50">
                  +{team.members.length - 8}
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-cream-100/60">조 진행 시작</span>
              <span className="font-semibold text-gold-400 transition group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {hydrated && (
        <footer className="mt-12 flex items-center justify-center gap-3 text-xs text-cream-100/40">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "조 명단/세션/투표를 모두 초기 시드로 되돌릴까요? (해당 브라우저에만 적용)",
                )
              ) {
                resetTeams();
                Object.keys(window.localStorage)
                  .filter((k) => k.startsWith("sponge-study:"))
                  .forEach((k) => window.localStorage.removeItem(k));
                window.location.reload();
              }
            }}
            className="rounded-md border border-ink-700 px-3 py-1.5 transition hover:border-ink-500 hover:text-cream-100/70"
          >
            전체 초기화
          </button>
          <span className="text-cream-100/30">
            데이터는 이 브라우저에만 저장됩니다
          </span>
        </footer>
      )}
    </main>
  );
}
