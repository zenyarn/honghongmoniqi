import { NextRequest, NextResponse } from "next/server";
import { query } from "@/storage/database/neon-client";

interface LeaderboardEntry {
  rank: number;
  username: string;
  userId: number;
  maxScore: number;
  bestResult: string;
  bestPlayedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { rows: data } = await query<{
      user_id: number;
      final_score: number;
      result: string;
      played_at: string;
      username: string | null;
    }>(
      `select gr.user_id, gr.final_score, gr.result, gr.played_at, u.username
       from game_records gr
       left join users u on u.id = gr.user_id
       order by gr.final_score desc, gr.result asc, gr.played_at desc
       limit 100`
    );

    // 处理数据：找出每个用户的最佳成绩
    const userBestRecords = new Map<number, LeaderboardEntry>();

    if (data) {
      for (const record of data) {
        const userId = record.user_id as number;
        
        if (!userBestRecords.has(userId)) {
          // 获取用户名
          const username = record.username || `用户${userId}`;
          
          userBestRecords.set(userId, {
            rank: 0,
            username,
            userId,
            maxScore: record.final_score,
            bestResult: record.result,
            bestPlayedAt: record.played_at,
          });
        }
      }
    }

    // 转换为数组并排序
    const leaderboard = Array.from(userBestRecords.values())
      .sort((a, b) => {
        // 首先按分数降序
        if (b.maxScore !== a.maxScore) {
          return b.maxScore - a.maxScore;
        }
        // 分数相同则通关优先
        if (a.bestResult !== b.bestResult) {
          return a.bestResult === "success" ? -1 : 1;
        }
        // 都通关则按时间升序（越快通关越好）
        return new Date(a.bestPlayedAt).getTime() - new Date(b.bestPlayedAt).getTime();
      })
      .slice(0, 20)  // 只取前20名
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({
      leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "获取排行榜失败" },
      { status: 500 }
    );
  }
}
