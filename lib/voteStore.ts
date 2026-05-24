import { kv } from "@vercel/kv";

export type VoteSnapshot = {
  votes: Record<string, number>;
  voters: string[];
  closed: boolean;
};

const isKvConfigured = () =>
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

// In-memory fallback for local dev when KV env vars are missing.
// Persisted across hot reloads via globalThis.
type MemStore = Map<number, VoteSnapshot>;
const g = globalThis as unknown as { __spongeMem?: MemStore };
if (!g.__spongeMem) g.__spongeMem = new Map<number, VoteSnapshot>();
const mem = g.__spongeMem;

const empty = (): VoteSnapshot => ({ votes: {}, voters: [], closed: false });

const countsKey = (teamId: number) => `sponge:votes:${teamId}:counts`;
const votersKey = (teamId: number) => `sponge:votes:${teamId}:voters`;
const closedKey = (teamId: number) => `sponge:votes:${teamId}:closed`;

export async function getSnapshot(teamId: number): Promise<VoteSnapshot> {
  if (!isKvConfigured()) {
    return mem.get(teamId) ?? empty();
  }
  const [counts, voters, closed] = await Promise.all([
    kv.hgetall<Record<string, number>>(countsKey(teamId)),
    kv.smembers<string[]>(votersKey(teamId)),
    kv.get<boolean>(closedKey(teamId)),
  ]);
  const normalized: Record<string, number> = {};
  if (counts) {
    for (const [k, v] of Object.entries(counts)) {
      normalized[k] = typeof v === "number" ? v : Number(v) || 0;
    }
  }
  return {
    votes: normalized,
    voters: Array.isArray(voters) ? voters : [],
    closed: !!closed,
  };
}

export type CastResult =
  | { ok: true; snapshot: VoteSnapshot }
  | { ok: false; reason: "duplicate" | "closed" | "invalid" };

export async function castVote(
  teamId: number,
  voter: string,
  candidate: string,
): Promise<CastResult> {
  const voterId = voter.trim();
  const cand = candidate.trim();
  if (!voterId || !cand) {
    return { ok: false, reason: "invalid" };
  }

  if (!isKvConfigured()) {
    const cur = mem.get(teamId) ?? empty();
    if (cur.closed) return { ok: false, reason: "closed" };
    if (cur.voters.includes(voterId)) return { ok: false, reason: "duplicate" };
    const next: VoteSnapshot = {
      ...cur,
      votes: { ...cur.votes, [cand]: (cur.votes[cand] ?? 0) + 1 },
      voters: [...cur.voters, voterId],
    };
    mem.set(teamId, next);
    return { ok: true, snapshot: next };
  }

  const closed = await kv.get<boolean>(closedKey(teamId));
  if (closed) return { ok: false, reason: "closed" };

  const added = await kv.sadd(votersKey(teamId), voterId);
  if (added === 0) {
    return { ok: false, reason: "duplicate" };
  }
  await kv.hincrby(countsKey(teamId), cand, 1);

  const snapshot = await getSnapshot(teamId);
  return { ok: true, snapshot };
}

export async function closeVoting(teamId: number): Promise<VoteSnapshot> {
  if (!isKvConfigured()) {
    const cur = mem.get(teamId) ?? empty();
    const next = { ...cur, closed: true };
    mem.set(teamId, next);
    return next;
  }
  await kv.set(closedKey(teamId), true);
  return getSnapshot(teamId);
}

export async function resetVoting(teamId: number): Promise<VoteSnapshot> {
  if (!isKvConfigured()) {
    mem.set(teamId, empty());
    return empty();
  }
  await Promise.all([
    kv.del(countsKey(teamId)),
    kv.del(votersKey(teamId)),
    kv.del(closedKey(teamId)),
  ]);
  return empty();
}
