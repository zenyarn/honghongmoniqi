import { NextRequest, NextResponse } from "next/server";

import { ensureAdminApiAccess } from "@/lib/auth/admin";
import { USER_STATUS_OPTIONS } from "@/lib/admin/data";
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
  const userId = Number(id);
  const body = await request.json();
  const status = body?.status as string | undefined;

  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "用户 ID 无效" }, { status: 400 });
  }

  if (!status || !USER_STATUS_OPTIONS.includes(status as (typeof USER_STATUS_OPTIONS)[number])) {
    return NextResponse.json({ error: "状态值无效" }, { status: 400 });
  }

  const { rows } = await query<{ id: number; status: string }>(
    `update users
     set status = $1
     where id = $2
     returning id, status`,
    [status, userId]
  );
  const data = rows[0] ?? null;

  if (!data) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: data,
  });
}
