import { NextRequest, NextResponse } from "next/server";
import { castVote, getSnapshot } from "@/lib/voteStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseTeamId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 6) return null;
  return n;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { teamId: string } },
) {
  const id = parseTeamId(params.teamId);
  if (id === null) return NextResponse.json({ error: "bad team" }, { status: 400 });
  const snap = await getSnapshot(id);
  return NextResponse.json(snap, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } },
) {
  const id = parseTeamId(params.teamId);
  if (id === null) return NextResponse.json({ error: "bad team" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const voter = typeof body?.voter === "string" ? body.voter : "";
  const candidate = typeof body?.candidate === "string" ? body.candidate : "";

  const result = await castVote(id, voter, candidate);
  if (!result.ok) {
    const status = result.reason === "duplicate" ? 409 : result.reason === "closed" ? 423 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json(result.snapshot);
}
