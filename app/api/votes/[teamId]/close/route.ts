import { NextRequest, NextResponse } from "next/server";
import { closeVoting } from "@/lib/voteStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { teamId: string } },
) {
  const id = Number(params.teamId);
  if (!Number.isInteger(id) || id < 1 || id > 6) {
    return NextResponse.json({ error: "bad team" }, { status: 400 });
  }
  const snap = await closeVoting(id);
  return NextResponse.json(snap);
}
