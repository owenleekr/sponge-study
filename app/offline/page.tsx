"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useOfflineTeams } from "@/lib/offlineStore";
import {
  Day,
  SECTION_INFO,
  MEETINGS,
  ROAMING_PHOTOGRAPHERS,
} from "@/lib/offlineTeams";

export default function OfflineHome() {
  const { teams, hydrated, addTeam, deleteTeam, resetAll } = useOfflineTeams();
  const [showAdd, setShowAdd] = useState(false);
  const [newDay, setNewDay] = useState<Day>("fri-p1");
  const [newLabel, setNewLabel] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newMod, setNewMod] = useState("");

  const grouped = useMemo(() => {
    const map: Record<Day, typeof teams> = {
      "fri-p1": [],
      "fri-p2": [],
      "sun-p1": [],
      "sun-p2": [],
    };
    for (const t of teams) {
      if (map[t.day]) map[t.day].push(t);
    }
    return map;
  }, [teams]);

  const submitAdd = () => {
    if (!newLabel.trim()) return alert("조 이름을 입력해주세요.");
    if (!newMod.trim()) return alert("모더레이터 이름을 입력해주세요.");
    addTeam(newDay, newLabel, newMod, newRoom);
    setNewLabel("");
    setNewMod("");
    setNewRoom("");
    setShowAdd(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <nav className="mb-6 text-sm text-cream-100/50">
        <Link href="/" className="hover:text-cream-100">
          ← 스폰지클럽 홈
        </Link>
      </nav>

      <header className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-3 text-3xl sm:text-4xl">
          <span>🎤</span>
          <h1 className="font-extrabold tracking-tight text-cream-50">
            Sponge Club 1기 · 조 편성표
          </h1>
        </div>
        <p className="text-sm text-cream-100/60">
          시간 설정 → 시작 → 타이머 끝나면 다음 발표자 공개
        </p>
      </header>

      {hydrated && (
        <>
          {MEETINGS.map((meeting) => (
            <section key={meeting.dayKey} className="mb-12">
              <div className="mb-4 flex items-end gap-3 border-l-4 border-gold-500 pl-3">
                <h2 className="text-2xl font-extrabold text-cream-50 sm:text-3xl">
                  {meeting.dayLabel}
                </h2>
                <div className="flex flex-wrap items-baseline gap-2 text-xs text-cream-100/60">
                  <span>{meeting.timeRange}</span>
                  {meeting.venue && <span>· {meeting.venue}</span>}
                  <span>· {meeting.headcount}</span>
                </div>
              </div>

              {meeting.parts.map((sectionKey) => {
                const info = SECTION_INFO[sectionKey];
                const teamsInSection = grouped[sectionKey];
                return (
                  <div key={sectionKey} className="mb-6">
                    <div className="mb-3 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-gold-400">
                        {info.partLabel}
                      </span>
                      <span className="text-xs text-cream-100/50">
                        · {info.timeRange}
                      </span>
                      {info.note && (
                        <span className="rounded-md bg-ink-700/50 px-2 py-0.5 text-[10px] text-cream-100/60">
                          {info.note}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {teamsInSection.map((t) => (
                        <div
                          key={t.id}
                          className="card group relative overflow-hidden p-4 transition hover:border-gold-500/60 hover:shadow-gold"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `'${info.partLabel} ${t.label}' 조를 삭제할까요?`,
                                )
                              ) {
                                deleteTeam(t.id);
                              }
                            }}
                            className="absolute right-2 top-2 rounded-md border border-ink-700 px-1.5 py-0.5 text-[10px] text-cream-100/30 transition hover:border-red-500/50 hover:text-red-400"
                          >
                            🗑
                          </button>

                          <Link href={`/offline/team/${t.id}`} className="block">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xl font-extrabold text-cream-50">
                                {t.label}
                              </div>
                              {t.room && (
                                <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
                                  {t.room}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-xs text-cream-100/50">
                              모더{" "}
                              <span className="text-cream-50">{t.moderator}</span>
                            </div>

                            <ul className="mt-3 space-y-0.5 text-xs text-cream-100/80">
                              {t.members.map((mem) => (
                                <li key={mem.id} className="truncate">
                                  {mem.name}
                                </li>
                              ))}
                            </ul>

                            <div className="mt-3 flex items-center justify-between text-xs">
                              <span className="text-cream-100/40">
                                {t.members.length + 1}명
                              </span>
                              <span className="font-semibold text-gold-400 transition group-hover:translate-x-1">
                                진행 →
                              </span>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}

          {/* 촬영 로밍 */}
          <section className="mb-8 rounded-xl border border-gold-500/30 bg-gold-500/5 px-4 py-3 text-center text-sm text-cream-100/80">
            📷 촬영 로밍 (전 조 함께):{" "}
            <span className="font-bold text-gold-300">
              {ROAMING_PHOTOGRAPHERS.join(" · ")}
            </span>
          </section>

          {/* + 새 조 추가 */}
          <section className="mt-6 mb-12 text-center">
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
                    섹션
                  </label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as Day)}
                    className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
                  >
                    {(Object.keys(SECTION_INFO) as Day[]).map((k) => (
                      <option key={k} value={k}>
                        {SECTION_INFO[k].dayLabel} · {SECTION_INFO[k].partLabel}{" "}
                        ({SECTION_INFO[k].timeRange})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
                      조 이름
                    </label>
                    <input
                      type="text"
                      placeholder="예: 5조"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
                      방 (선택)
                    </label>
                    <input
                      type="text"
                      placeholder="예: 805호"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
                    />
                  </div>
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
                  <button onClick={() => setShowAdd(false)} className="btn-ghost">
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
