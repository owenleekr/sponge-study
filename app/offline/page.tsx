"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useOfflineTeams } from "@/lib/offlineStore";
import { DAY_LABEL, Day, MEETING_INFO } from "@/lib/offlineTeams";

export default function OfflineHome() {
  const { teams, hydrated, addTeam, deleteTeam, resetAll } = useOfflineTeams();
  const [showAdd, setShowAdd] = useState(false);
  const [newDay, setNewDay] = useState<Day>("part1");
  const [newLabel, setNewLabel] = useState("");
  const [newMod, setNewMod] = useState("");

  const byDay = useMemo(() => {
    return {
      part1: teams.filter((t) => t.day === "part1"),
      part2: teams.filter((t) => t.day === "part2"),
    };
  }, [teams]);

  const submitAdd = () => {
    if (!newLabel.trim()) return alert("조 이름을 입력해주세요.");
    if (!newMod.trim()) return alert("모더레이터 이름을 입력해주세요.");
    addTeam(newDay, newLabel, newMod);
    setNewLabel("");
    setNewMod("");
    setShowAdd(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <nav className="mb-6 text-sm text-cream-100/50">
        <Link href="/" className="hover:text-cream-100">
          ← 스폰지클럽 홈
        </Link>
      </nav>

      <header className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-3 text-3xl sm:text-4xl">
          <span>🎤</span>
          <h1 className="font-extrabold tracking-tight text-cream-50">
            오프라인 모임 · 로테이션 발표
          </h1>
        </div>
        <p className="text-sm text-cream-100/70 sm:text-base">
          🟦 {MEETING_INFO.date} · {MEETING_INFO.time} · {MEETING_INFO.venue}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="chip-muted">{MEETING_INFO.assigned}</span>
          <span className="chip">
            📷 촬영 로밍 {MEETING_INFO.roamingPhotographers.join(" · ")} (전 조 함께)
          </span>
        </div>
        <p className="mt-3 text-xs text-cream-100/60">
          시간 설정 → 시작 → 타이머 끝나면 자동으로 다음 발표자
        </p>
      </header>

      {hydrated && (
        <>
          {(["part1", "part2"] as const).map((day) => (
            <section key={day} className="mb-10">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="text-xl font-bold text-cream-50">
                  {DAY_LABEL[day]}{" "}
                  <span className="ml-2 text-sm font-normal text-cream-100/50">
                    {byDay[day].length}개 조 ·{" "}
                    {byDay[day].reduce(
                      (sum, t) => sum + t.members.length + 1,
                      0,
                    )}
                    명
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byDay[day].map((team) => (
                  <div
                    key={team.id}
                    className="card group relative overflow-hidden p-5 transition hover:border-gold-500/60 hover:shadow-gold"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (
                          window.confirm(`'${team.label}' 조를 삭제할까요?`)
                        ) {
                          deleteTeam(team.id);
                        }
                      }}
                      className="absolute right-3 top-3 rounded-md border border-ink-700 px-2 py-1 text-[10px] text-cream-100/30 transition hover:border-red-500/50 hover:text-red-400"
                      title="조 삭제"
                    >
                      🗑
                    </button>

                    <Link href={`/offline/team/${team.id}`} className="block">
                      <div className="mb-2 text-xs font-semibold tracking-widest text-gold-400">
                        {team.label}
                      </div>
                      <div className="mb-3 text-xl font-bold text-cream-50">
                        🎙 {team.moderator}
                      </div>
                      <div className="mb-3 text-xs uppercase tracking-wider text-cream-100/40">
                        조원 {team.members.length}명
                      </div>
                      <div className="-m-0.5 flex flex-wrap gap-1.5">
                        {team.members.slice(0, 8).map((mem) => (
                          <span
                            key={mem.id}
                            className="m-0.5 inline-block rounded-md bg-ink-700/60 px-2 py-0.5 text-[11px] text-cream-100/80"
                          >
                            {mem.name}
                          </span>
                        ))}
                        {team.members.length > 8 && (
                          <span className="m-0.5 inline-block rounded-md bg-ink-700/30 px-2 py-0.5 text-[11px] text-cream-100/50">
                            +{team.members.length - 8}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-cream-100/60">진행하기</span>
                        <span className="font-semibold text-gold-400 transition group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* + 새 조 추가 */}
          <section className="mt-8 mb-12 text-center">
            {!showAdd ? (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="btn-ghost"
              >
                + 새 조 추가
              </button>
            ) : (
              <div className="card mx-auto max-w-md p-5 text-left">
                <h3 className="mb-3 text-sm font-bold text-cream-50">
                  새 조 추가
                </h3>
                <div className="mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
                    파트
                  </label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as Day)}
                    className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
                  >
                    <option value="part1">파트 1 · 19:30~20:50</option>
                    <option value="part2">파트 2 · 21:00~22:20</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
                    조 이름
                  </label>
                  <input
                    type="text"
                    placeholder="예: 파트1 · 5조"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
                  />
                </div>
                <div className="mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
                    모더레이터
                  </label>
                  <input
                    type="text"
                    placeholder="예: 오웬"
                    value={newMod}
                    onChange={(e) => setNewMod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={submitAdd} className="btn-gold flex-1">
                    추가
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="btn-ghost"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </section>

          <footer className="mt-6 flex items-center justify-center gap-3 text-xs text-cream-100/40">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "오프라인 모임 명단을 초기 시드로 되돌릴까요? (이 브라우저만 적용)",
                  )
                ) {
                  resetAll();
                  Object.keys(window.localStorage)
                    .filter((k) =>
                      k.startsWith("sponge-study:offline:session:"),
                    )
                    .forEach((k) => window.localStorage.removeItem(k));
                  window.location.reload();
                }
              }}
              className="rounded-md border border-ink-700 px-3 py-1.5 transition hover:border-ink-500 hover:text-cream-100/70"
            >
              오프라인 데이터 초기화
            </button>
          </footer>
        </>
      )}
    </main>
  );
}
