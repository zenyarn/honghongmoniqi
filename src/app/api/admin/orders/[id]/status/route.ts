import { NextRequest, NextResponse } from "next/server";

import { ensureAdminApiAccess } from "@/lib/auth/admin";
import { RECORD_STATUS_OPTIONS } from "@/lib/admin/data";
import { query } from "@/storage/database/neon-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const { id } = await params;
  const recordId = Number(id);
  const body = await request.json();
  const status = body?.status as string | undefined;

  if (!Number.isFinite(recordId)) {
    return NextResponse.json({ error: "记录 ID 无效" }, { status: 400 });
  }

  if (!status || !RECORD_STATUS_OPTIONS.includes(status as (typeof RECORD_STATUS_OPTIONS)[number])) {
    return NextResponse.json({ error: "状态值无效" }, { status: 400 });
  }

  const { rows } = await query<{ id: number; result: string }>(
    `update game_records
     set result = $1
     where id = $2
     returning id, result`,
    [status, recordId]
  );
  const data = rows[0] ?? null;

  if (!data) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    order: data,
  });
}
