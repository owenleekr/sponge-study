"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTeam, useSession, shuffle, assignFeedback, sortMembers } from "@/lib/store";
import { ROLE_COLORS, Role } from "@/lib/teams";

export default function TeamPage({ params }: { params: { id: string } }) {
  const teamId = Number(params.id);
  const router = useRouter();
  const { team, hydrated, updateTeam } = useTeam(teamId);
  const { session, update: updateSession } = useSession(teamId);

  const [attending, setAttending] = useState<Record<string, boolean>>({});
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("크루");

  const sortedMembers = useMemo(
    () => (team ? sortMembers(team.members) : []),
    [team],
  );

  if (!hydrated || !team) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-cream-100/60">불러오는 중…</p>
      </main>
    );
  }

  const attendingIds = sortedMembers
    .filter((m) => attending[m.id] !== false)
    .map((m) => m.id);

  const startPresentation = () => {
    if (attendingIds.length < 2) {
      alert("발표를 시작하려면 최소 2명 이상 참여해야 합니다.");
      return;
    }
    const order = shuffle(attendingIds);
    const feedback = assignFeedback(order);
    updateSession(() => ({
      order,
      index: 0,
      feedback,
      timerEndsAt: null,
      paused: true,
      remainingMs: 8 * 60 * 1000,
      durationMs: 8 * 60 * 1000,
    }));
    router.push(`/team/${teamId}/present`);
  };

  const addMember = () => {
    const name = newName.trim();
    if (!name) return;
    if (team.members.some((m) => m.name === name)) {
      alert("이미 같은 이름의 멤버가 있습니다.");
      return;
    }
    updateTeam(teamId, (t) => ({
      ...t,
      members: [...t.members, { id: name, name, role: newRole }],
    }));
    setNewName("");
    setNewRole("크루");
  };

  const removeMember = (id: string) => {
    if (!window.confirm(`'${id}' 멤버를 명단에서 삭제할까요?`)) return;
    updateTeam(teamId, (t) => ({
      ...t,
      members: t.members.filter((m) => m.id !== id),
    }));
    setAttending((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <nav className="mb-6 text-sm text-cream-100/50">
        <Link href="/" className="hover:text-cream-100">
          ← 조 선택
        </Link>
      </nav>

      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-widest text-gold-400">
            {team.id}조
          </div>
          <h1 className="mt-1 text-3xl font-extrabold text-cream-50 sm:text-4xl">
            조장 {team.leaderName}
          </h1>
          <p className="mt-2 text-sm text-cream-100/70">{team.theme}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip">참여 {attendingIds.length}명</span>
          <span className="chip-muted">전체 {team.members.length}명</span>
        </div>
      </header>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-cream-50">멤버 명단 · 출석 체크</h2>
          <button
            type="button"
            onClick={() => setAttending({})}
            className="text-xs text-cream-100/50 hover:text-cream-100"
          >
            출석 전체 초기화
          </button>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sortedMembers.map((mem) => {
            const isHere = attending[mem.id] !== false;
            return (
              <li
                key={mem.id}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                  isHere
                    ? "border-ink-600 bg-ink-800/60"
                    : "border-ink-700 bg-ink-900/30 opacity-50"
                }`}
              >
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isHere}
                    onChange={(e) =>
                      setAttending((prev) => ({
                        ...prev,
                        [mem.id]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-gold-500"
                  />
                  <span
                    className={`inline-block min-w-[60px] rounded-md px-2 py-0.5 text-center text-[10px] font-bold tracking-wider ${
                      ROLE_COLORS[mem.role]
                    }`}
                  >
                    {mem.role}
                  </span>
                  <span className="text-sm font-medium text-cream-50">
                    {mem.name}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => removeMember(mem.id)}
                  className="ml-2 rounded-md border border-ink-700 px-2 py-1 text-xs text-cream-100/40 transition hover:border-red-500/50 hover:text-red-400"
                  title="명단에서 삭제"
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 rounded-xl border border-dashed border-ink-600 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream-100/50">
            + 멤버 추가
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="이름(닉네임)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addMember();
              }}
              className="flex-1 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500"
            >
              <option value="크루">크루</option>
              <option value="조장">조장</option>
              <option value="부조장">부조장</option>
              <option value="셀피쉬크루">셀피쉬크루</option>
            </select>
            <button
              type="button"
              onClick={addMember}
              className="btn-ghost px-4 py-2.5 text-sm"
            >
              추가
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={startPresentation}
          className="btn-gold w-full max-w-md text-base sm:text-lg"
        >
          🎲 발표 순서 랜덤 생성 + 시작
        </button>
        {session.order.length > 0 && (
          <Link
            href={`/team/${teamId}/present`}
            className="text-sm text-cream-100/70 underline-offset-4 hover:text-gold-400 hover:underline"
          >
            진행 중인 발표 이어서 보기 ({session.index + 1}/{session.order.length})
          </Link>
        )}
        <Link
          href={`/team/${teamId}/vote`}
          className="text-sm text-cream-100/50 underline-offset-4 hover:text-gold-400 hover:underline"
        >
          MVP 투표 / 결과 보기
        </Link>
      </section>
    </main>
  );
}
