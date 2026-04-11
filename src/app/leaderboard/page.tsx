"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Crown, Medal, User } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  userId: number;
  maxScore: number;
  bestResult: string;
  bestPlayedAt: string;
}

interface User {
  id: number;
  username: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // 检查当前登录用户
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }

    // 获取排行榜数据
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-6 h-6 text-yellow-500" />;
    }
    if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-400" />;
    }
    if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-600" />;
    }
    return <span className="w-6 text-center font-bold text-gray-400">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-100 to-yellow-50";
    if (rank === 2) return "bg-gradient-to-r from-gray-100 to-gray-50";
    if (rank === 3) return "bg-gradient-to-r from-amber-100 to-amber-50";
    return "";
  };

  const getScoreColor = (score: number) => {
    if (score >= 10) return "text-pink-500";
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-pink-500 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-gray-700">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">排行榜</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-3">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">排行榜</h1>
          <p className="text-gray-500 text-sm mt-1">谁的哄人技术最强？</p>
        </div>

        {/* 排行榜列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                暂无排行榜数据
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                快来成为第一个上榜的玩家吧！
              </p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-pink-50 text-pink-500 rounded-lg text-sm hover:bg-pink-100 transition-colors"
              >
                去玩一局
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leaderboard.map((entry) => {
                const isCurrentUser = currentUser && currentUser.id === entry.userId;
                return (
                  <div
                    key={entry.userId}
                    className={`
                      p-4 flex items-center gap-4 transition-colors
                      ${getRankBg(entry.rank)}
                      ${isCurrentUser ? "ring-2 ring-pink-400 ring-inset bg-pink-50/50" : ""}
                    `}
                  >
                    {/* 排名 */}
                    <div className="w-10 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* 用户信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 truncate">
                          {entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full">
                            你
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDate(entry.bestPlayedAt)}
                      </div>
                    </div>

                    {/* 分数 */}
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(entry.maxScore)}`}>
                        {entry.maxScore}
                      </div>
                      <div className="text-xs text-gray-400">好感度</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          {currentUser ? (
            <p>排行榜实时更新，加油提升排名！</p>
          ) : (
            <p>
              <Link href="/login" className="text-pink-500 hover:underline">
                登录
              </Link>
              后让你的成绩上榜
            </p>
          )}
        </div>

        {/* 返回按钮 */}
        <div className="mt-4">
          <Link
            href="/"
            className="block w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-center rounded-xl font-medium transition-colors"
          >
            去练习哄人技巧
          </Link>
        </div>
      </div>
    </div>
  );
}
