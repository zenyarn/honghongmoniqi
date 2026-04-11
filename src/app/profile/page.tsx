"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Gamepad2, Trophy, Clock, CheckCircle, XCircle } from "lucide-react";

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

interface User {
  id: number;
  username: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  useEffect(() => {
    // 检查用户登录状态
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);

      // 获取游戏记录
      fetch(`/api/game-records?userId=${parsedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.records) {
            setRecords(data.records);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } catch {
      setNotLoggedIn(true);
      setLoading(false);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getResultBadge = (result: string) => {
    if (result === "success") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          通关
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
        <XCircle className="w-3 h-3" />
        失败
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  // 计算统计数据
  const totalGames = records.length;
  const successGames = records.filter((r) => r.result === "success").length;
  const successRate = totalGames > 0 ? Math.round((successGames / totalGames) * 100) : 0;
  const avgScore = totalGames > 0
    ? Math.round(records.reduce((sum, r) => sum + r.final_score, 0) / totalGames)
    : 0;

  if (notLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
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
              <User className="w-5 h-5" />
              <span className="font-medium">个人中心</span>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              请先登录
            </h2>
            <p className="text-gray-500 mb-6">
              登录后可查看游戏记录和统计数据
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-medium transition-colors"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
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
            <User className="w-5 h-5" />
            <span className="font-medium">个人中心</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 用户信息 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{user?.username}</h1>
              <p className="text-gray-500 text-sm">开始哄人练习</p>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Gamepad2 className="w-4 h-4" />
              <span>总场次</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{totalGames}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Trophy className="w-4 h-4" />
              <span>通关率</span>
            </div>
            <div className="text-2xl font-bold text-pink-500">{successRate}%</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>通关次数</span>
            </div>
            <div className="text-2xl font-bold text-green-500">{successGames}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <span>平均好感度</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{avgScore}</div>
          </div>
        </div>

        {/* 游戏记录列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              游戏记录
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              加载中...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🎮</div>
              <p className="text-gray-500">还没有游戏记录</p>
              <Link
                href="/"
                className="mt-4 inline-block px-4 py-2 bg-pink-50 text-pink-500 rounded-lg text-sm hover:bg-pink-100 transition-colors"
              >
                去玩一局
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {records.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{record.scenario}</span>
                      {getResultBadge(record.result)}
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(record.final_score)}`}>
                      {record.final_score}
                      <span className="text-xs text-gray-400 ml-1">好感度</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(record.played_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
