import { redirect } from "next/navigation";

import { getSessionPayload } from "@/lib/auth/session";
import { queryOne } from "@/storage/database/neon-client";

function getAdminUsernames() {
  const fromEnv = process.env.ADMIN_USERNAMES
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (fromEnv?.length) {
    return new Set(fromEnv);
  }

  // TODO: configure ADMIN_USERNAMES in .env.local instead of relying on this local fallback.
  return new Set(["mfyx"]);
}

export async function getCurrentUser() {
  const session = await getSessionPayload();
  if (!session) {
    return null;
  }

  const data = await queryOne<{
    id: number;
    username: string;
    status: string;
    created_at: string | null;
  }>(
    "select id, username, status, created_at from users where id = $1 limit 1",
    [session.userId]
  );

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    status: data.status ?? "active",
    createdAt: data.created_at,
    isAdmin: getAdminUsernames().has(data.username),
  };
}

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    return {
      ...user,
      accessDenied: true as const,
    };
  }

  return {
    ...user,
    accessDenied: false as const,
  };
}

export async function ensureAdminApiAccess() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, status: 401, message: "请先登录" };
  }

  if (!user.isAdmin) {
    return { ok: false as const, status: 403, message: "仅管理员可访问" };
  }

  return { ok: true as const, user };
}
