"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTeam, useSession, sortMembers } from "@/lib/store";
import { ROLE_COLORS } from "@/lib/teams";

type Snapshot = {
  votes: Record<string, number>;
  voters: string[];
  closed: boolean;
};

const EMPTY: Snapshot = { votes: {}, voters: [], closed: false };

const VOTER_KEY = (teamId: number) => `sponge-study:voter:${teamId}:v1`;

export default function VotePage({ params }: { params: { id: string } }) {
  const teamId = Number(params.id);
  const { team, hydrated } = useTeam(teamId);
  const { session } = useSession(teamId);

  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [voterName, setVoterName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [myVoter, setMyVoter] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const lastSyncRef = useRef<number>(0);

  // load my voter name from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VOTER_KEY(teamId));
      if (stored) setMyVoter(stored);
    } catch {}
  }, [teamId]);

  // poll snapshot every 2s
  useEffect(() => {
    let mounted = true;
    const fetchSnap = async () => {
      try {
        const res = await fetch(`/api/votes/${teamId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Snapshot;
        if (!mounted) return;
        setSnap(data);
        setLoaded(true);
        lastSyncRef.current = Date.now();
      } catch {}
    };
    fetchSnap();
    const id = window.setInterval(fetchSnap, 2000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [teamId]);

  const eligible = useMemo(() => {
    if (!team) return [];
    if (session.order.length > 0) {
      return session.order
        .map((id) => team.members.find((m) => m.id === id))
        .filter((m): m is NonNullable<typeof m> => !!m);
    }
    return sortMembers(team.members);
  }, [team, session]);

  if (!hydrated || !team) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-cream-100/60">불러오는 중…</p>
      </main>
    );
  }

  const totalVotes = Object.values(snap.votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(0, ...Object.values(snap.votes));
  const winners = Object.entries(snap.votes)
    .filter(([, v]) => v === maxVotes && maxVotes > 0)
    .map(([id]) => id);

  const alreadyVotedHere = !!myVoter && snap.voters.includes(myVoter);

  const submitVote = async () => {
    const voter = voterName.trim();
    setErrMsg(null);
    if (!voter) {
      setErrMsg("투표자 이름(닉네임)을 적어주세요.");
      return;
    }
    if (!selected) {
      setErrMsg("MVP로 뽑을 1명을 선택해주세요.");
      return;
    }
    if (snap.voters.includes(voter)) {
      setErrMsg(`'${voter}' 이름으로 이미 투표했어요.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/votes/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter, candidate: selected }),
      });
      if (res.status === 409) {
        setErrMsg(`'${voter}' 이름은 이미 사용됨. 다른 닉네임을 적어주세요.`);
        return;
      }
      if (res.status === 423) {
        setErrMsg("이미 마감된 투표입니다.");
        return;
      }
      if (!res.ok) {
        setErrMsg(`서버 오류 (${res.status})`);
        return;
      }
      const data = (await res.json()) as Snapshot;
      setSnap(data);
      try {
        window.localStorage.setItem(VOTER_KEY(teamId), voter);
      } catch {}
      setMyVoter(voter);
      setVoterName("");
      setSelected(null);
    } catch {
      setErrMsg("네트워크 오류. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeVoting = async () => {
    if (!window.confirm("투표를 마감할까요? (이후 결과만 표시)")) return;
    const res = await fetch(`/api/votes/${teamId}/close`, { method: "POST" });
    if (res.ok) setSnap(await res.json());
  };

  const resetVoting = async () => {
    if (!window.confirm("이 조의 투표를 모두 리셋할까요? (모든 디바이스 적용)")) return;
    const res = await fetch(`/api/votes/${teamId}/reset`, { method: "POST" });
    if (res.ok) {
      setSnap(await res.json());
      try {
        window.localStorage.removeItem(VOTER_KEY(teamId));
      } catch {}
      setMyVoter(null);
    }
  };

  const forgetMyVote = () => {
    try {
      window.localStorage.removeItem(VOTER_KEY(teamId));
    } catch {}
    setMyVoter(null);
  };

  const memberName = (id: string) =>
    team.members.find((m) => m.id === id)?.name ?? id;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <nav className="mb-4 flex items-center justify-between text-sm text-cream-100/50">
        <Link href={`/team/${teamId}`} className="hover:text-cream-100">
          ← {team.id}조
        </Link>
        <Link href={`/team/${teamId}/present`} className="hover:text-gold-400">
          ← 발표 화면
        </Link>
      </nav>

      <header className="mb-6 text-center">
        <div className="text-xs font-semibold tracking-widest text-gold-400">
          🏆 {team.id}조 MVP 투표
        </div>
        <h1 className="mt-1 text-3xl font-extrabold text-cream-50 sm:text-4xl">
          오늘의 MVP는?
        </h1>
        <p className="mt-2 text-sm text-cream-100/60">
          1인 1표 · 같은 닉네임은 중복 투표 불가 · 모든 디바이스에서 실시간 동기화
        </p>
      </header>

      {!loaded && (
        <p className="card p-5 text-center text-sm text-cream-100/50">
          서버에서 결과 가져오는 중…
        </p>
      )}

      {loaded && !snap.closed && !alreadyVotedHere && (
        <section className="card p-5 sm:p-6">
          <div className="mb-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-cream-100/50">
              내 이름(닉네임)
            </label>
            <input
              type="text"
              placeholder="예: 오웬"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              disabled={submitting}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500 disabled:opacity-50"
            />
          </div>

          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream-100/50">
            MVP 1명 선택
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {eligible.map((mem) => {
              const isSelected = selected === mem.id;
              return (
                <li key={mem.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(mem.id)}
                    disabled={submitting}
                    className={`flex w-full flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-50 ${
                      isSelected
                        ? "border-gold-500 bg-gold-500/15 text-cream-50 shadow-gold"
                        : "border-ink-700 bg-ink-800/40 text-cream-100/80 hover:border-ink-500"
                    }`}
                  >
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                        ROLE_COLORS[mem.role]
                      }`}
                    >
                      {mem.role}
                    </span>
                    <span className="text-sm font-semibold">{mem.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {errMsg && (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errMsg}
            </p>
          )}

          <button
            type="button"
            onClick={submitVote}
            disabled={submitting}
            className="btn-gold mt-5 w-full"
          >
            {submitting ? "전송 중…" : "🗳 투표하기"}
          </button>
        </section>
      )}

      {loaded && alreadyVotedHere && !snap.closed && (
        <section className="card p-5 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-400">
            ✓ 투표 완료
          </div>
          <p className="mt-2 text-cream-50">
            <span className="font-bold">{myVoter}</span> 이름으로 이 디바이스에서
            투표를 마쳤습니다
          </p>
          <button
            onClick={forgetMyVote}
            className="mt-3 text-xs text-cream-100/40 underline hover:text-cream-100"
          >
            다른 사람이 이 디바이스 쓰기 (내 투표 기록 잊기)
          </button>
        </section>
      )}

      {loaded && snap.closed && (
        <section className="card p-5 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold-400">
            🔒 투표 마감
          </div>
          <p className="mt-2 text-sm text-cream-100/60">
            결과는 아래에서 확인하세요
          </p>
        </section>
      )}

      <section className="card mt-6 p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-cream-50">
            결과 {snap.closed && <span className="text-sm font-normal text-gold-400">· 마감됨</span>}
          </h2>
          <div className="flex items-center gap-2 text-xs text-cream-100/60">
            <span className="chip-muted">투표 {totalVotes}표</span>
            <span className="chip-muted">참여 {snap.voters.length}명</span>
          </div>
        </div>

        {totalVotes === 0 ? (
          <p className="py-6 text-center text-sm text-cream-100/50">
            아직 투표가 없습니다
          </p>
        ) : (
          <ul className="space-y-2">
            {eligible
              .map((m) => ({ id: m.id, name: m.name, votes: snap.votes[m.id] ?? 0 }))
              .sort((a, b) => b.votes - a.votes)
              .map((row) => {
                const pct = totalVotes === 0 ? 0 : (row.votes / totalVotes) * 100;
                const isWinner = winners.includes(row.id);
                return (
                  <li key={row.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          isWinner ? "text-gold-300" : "text-cream-100/80"
                        }`}
                      >
                        {isWinner && row.votes > 0 && "🏆 "}
                        {row.name}
                      </span>
                      <span className="tabular text-cream-100/60">
                        {row.votes}표 · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          isWinner ? "bg-gold-500" : "bg-ink-600"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        )}

        {snap.voters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {snap.voters.map((n) => (
              <span key={n} className="chip-muted">
                ✓ {n}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-ink-700 pt-4">
          {!snap.closed && (
            <button onClick={closeVoting} className="btn-ghost text-sm">
              투표 마감
            </button>
          )}
          <button
            onClick={resetVoting}
            className="rounded-lg border border-ink-700 px-3 py-2 text-xs text-cream-100/50 transition hover:border-red-500/50 hover:text-red-400"
          >
            전체 리셋 (모든 디바이스)
          </button>
        </div>
      </section>

      {winners.length > 0 && snap.closed && (
        <section className="mt-6 rounded-2xl border-2 border-gold-500 bg-gold-500/10 p-6 text-center shadow-gold">
          <div className="text-xs font-bold uppercase tracking-widest text-gold-300">
            오늘의 MVP
          </div>
          <div className="mt-2 text-3xl font-extrabold text-cream-50 sm:text-4xl">
            🏆 {winners.map(memberName).join(" · ")}
          </div>
          <div className="mt-2 text-sm text-cream-100/70">{maxVotes}표로 선정</div>
        </section>
      )}
    </main>
  );
}
