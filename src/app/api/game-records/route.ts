import { NextRequest, NextResponse } from "next/server";
import { query } from "@/storage/database/neon-client";

interface GameRecord {
  id: number;
  user_id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

// 保存游戏记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scenario, finalScore, result } = body;

    // 验证输入
    if (!userId || !scenario || finalScore === undefined || !result) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 验证 result 值
    if (!["success", "failed"].includes(result)) {
      return NextResponse.json(
        { error: "结果值无效" },
        { status: 400 }
      );
    }

    const { rows } = await query<GameRecord>(
      `insert into game_records (user_id, scenario, final_score, result)
       values ($1, $2, $3, $4)
       returning id, user_id, scenario, final_score, result, played_at`,
      [userId, scenario, finalScore, result]
    );
    const data = rows[0] ?? null;

    if (!data) {
      return NextResponse.json(
        { error: "保存失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error("Save game record error:", error);
    return NextResponse.json(
      { error: "保存游戏记录失败" },
      { status: 500 }
    );
  }
}

// 获取用户游戏记录列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "缺少用户ID" },
        { status: 400 }
      );
    }

    const { rows } = await query<GameRecord>(
      `select id, user_id, scenario, final_score, result, played_at
       from game_records
       where user_id = $1
       order by played_at desc
       limit 50`,
      [Number(userId)]
    );

    const records = rows;

    return NextResponse.json({
      records,
    });
  } catch (error) {
    console.error("Get game records error:", error);
    return NextResponse.json(
      { error: "获取游戏记录失败" },
      { status: 500 }
    );
  }
}
