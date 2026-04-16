import { query, queryOne } from "@/storage/database/neon-client";

export const ADMIN_PAGE_SIZE = 10;
export const USER_STATUS_OPTIONS = ["active", "disabled"] as const;
export const RECORD_STATUS_OPTIONS = ["success", "failed"] as const;

export type UserStatus = (typeof USER_STATUS_OPTIONS)[number];
export type RecordStatus = (typeof RECORD_STATUS_OPTIONS)[number];

export type AdminUserRow = {
  id: number;
  username: string;
  status: string;
  created_at: string | null;
};

export type AdminRecordRow = {
  id: number;
  user_id: number | null;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string | null;
  users: {
    id: number;
    username: string;
  } | null;
};

type SqlRecordRow = {
  id: number;
  user_id: number | null;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string | null;
  user_ref_id: number | null;
  user_username: string | null;
};

type AdminPageResult<T> = {
  rows: T[];
  total: number;
};

export async function getAdminDashboardStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    userCountResult,
    newUserCountResult,
    recordCountResult,
    recentRecordCountResult,
  ] = await Promise.all([
    queryOne<{ count: string }>("select count(*)::text as count from users"),
    queryOne<{ count: string }>(
      "select count(*)::text as count from users where created_at >= $1",
      [sevenDaysAgo]
    ),
    queryOne<{ count: string }>("select count(*)::text as count from game_records"),
    queryOne<{ count: string }>(
      "select count(*)::text as count from game_records where played_at >= $1",
      [sevenDaysAgo]
    ),
  ]);

  return {
    userCount: Number(userCountResult?.count ?? 0),
    newUserCount: Number(newUserCountResult?.count ?? 0),
    recordCount: Number(recordCountResult?.count ?? 0),
    recentRecordCount: Number(recentRecordCountResult?.count ?? 0),
  };
}

export async function getUsersPage(input: {
  page: number;
  query: string;
  status: string;
}): Promise<AdminPageResult<AdminUserRow>> {
  const offset = (input.page - 1) * ADMIN_PAGE_SIZE;
  const where: string[] = [];
  const params: unknown[] = [];

  if (input.query) {
    params.push(`%${input.query}%`);
    where.push(`username ilike $${params.length}`);
  }

  if (input.status && input.status !== "all") {
    params.push(input.status);
    where.push(`status = $${params.length}`);
  }

  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const countResult = await queryOne<{ count: string }>(
    `select count(*)::text as count from users ${whereSql}`,
    params
  );

  params.push(ADMIN_PAGE_SIZE, offset);
  const { rows } = await query<AdminUserRow>(
    `select id, username, status, created_at
     from users
     ${whereSql}
     order by created_at desc nulls last
     limit $${params.length - 1} offset $${params.length}`,
    params
  );

  return {
    rows,
    total: Number(countResult?.count ?? 0),
  };
}

async function findMatchingUserIdsByUsername(search: string) {
  const { rows } = await query<{ id: number }>(
    "select id from users where username ilike $1 limit 50",
    [`%${search}%`]
  );

  return rows.map((item) => item.id);
}

export async function getRecordsPage(input: {
  page: number;
  query: string;
  status: string;
}): Promise<AdminPageResult<AdminRecordRow>> {
  const offset = (input.page - 1) * ADMIN_PAGE_SIZE;
  let matchedUserIds: number[] | null = null;
  let exactId: number | null = null;
  const search = input.query.trim();
  const where: string[] = [];
  const params: unknown[] = [];

  if (search) {
    matchedUserIds = await findMatchingUserIdsByUsername(search);
    exactId = /^\d+$/.test(search) ? Number(search) : null;
  }

  if (input.status && input.status !== "all") {
    params.push(input.status);
    where.push(`gr.result = $${params.length}`);
  }

  if (search) {
    const searchClauses: string[] = [];

    params.push(`%${search}%`);
    searchClauses.push(`gr.scenario ilike $${params.length}`);

    if (exactId !== null) {
      params.push(exactId);
      searchClauses.push(`gr.id = $${params.length}`);
    }

    if (matchedUserIds?.length) {
      params.push(matchedUserIds);
      searchClauses.push(`gr.user_id = any($${params.length}::int[])`);
    }

    where.push(`(${searchClauses.join(" or ")})`);
  }

  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const countResult = await queryOne<{ count: string }>(
    `select count(*)::text as count
     from game_records gr
     left join users u on u.id = gr.user_id
     ${whereSql}`,
    params
  );

  params.push(ADMIN_PAGE_SIZE, offset);
  const { rows } = await query<SqlRecordRow>(
    `select
       gr.id,
       gr.user_id,
       gr.scenario,
       gr.final_score,
       gr.result,
       gr.played_at,
       u.id as user_ref_id,
       u.username as user_username
     from game_records gr
     left join users u on u.id = gr.user_id
     ${whereSql}
     order by gr.played_at desc nulls last
     limit $${params.length - 1} offset $${params.length}`,
    params
  );

  return {
    rows: rows.map((record) => ({
      id: record.id,
      user_id: record.user_id,
      scenario: record.scenario,
      final_score: record.final_score,
      result: record.result,
      played_at: record.played_at,
      users: record.user_ref_id
        ? {
            id: record.user_ref_id,
            username: record.user_username ?? "--",
          }
        : null,
    })),
    total: Number(countResult?.count ?? 0),
  };
}

export async function getRecordDetail(id: number) {
  const record = await queryOne<SqlRecordRow>(
    `select
       gr.id,
       gr.user_id,
       gr.scenario,
       gr.final_score,
       gr.result,
       gr.played_at,
       u.id as user_ref_id,
       u.username as user_username
     from game_records gr
     left join users u on u.id = gr.user_id
     where gr.id = $1
     limit 1`,
    [id]
  );

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    user_id: record.user_id,
    scenario: record.scenario,
    final_score: record.final_score,
    result: record.result,
    played_at: record.played_at,
    users: record.user_ref_id
      ? {
          id: record.user_ref_id,
          username: record.user_username ?? "--",
        }
      : null,
  } satisfies AdminRecordRow;
}
