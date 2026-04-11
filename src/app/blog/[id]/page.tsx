"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
}

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (articleId) {
      fetch(`/api/blog?id=${articleId}`)
        .then((res) => res.json())
        .then((data) => {
          setArticle(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [articleId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/blog"
            className="flex items-center gap-1 text-pink-500 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回攻略</span>
          </Link>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="mt-6 h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        ) : article ? (
          <article className="bg-white rounded-2xl p-6 shadow-sm">
            {/* 文章标题 */}
            <div className="text-center mb-6 pb-6 border-b border-gray-100">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 rounded-full text-pink-500 text-sm mb-4">
                <BookOpen className="w-4 h-4" />
                <span>恋爱攻略</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-3">
                {article.title}
              </h1>
              <p className="text-gray-400 text-sm">
                {new Date(article.createdAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* 文章内容 */}
            <div className="prose prose-gray max-w-none">
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">
                {article.content}
              </div>
            </div>

            {/* 底部导航 */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link
                href="/blog"
                className="flex items-center justify-center gap-2 w-full py-3 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl transition-colors font-medium"
              >
                <BookOpen className="w-5 h-5" />
                <span>查看更多攻略</span>
              </Link>
            </div>

            {/* 相关推荐 */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-xl">
              <p className="text-yellow-700 text-sm">
                💡 小提示：学会这些技巧后，来{" "}
                <Link href="/" className="underline font-medium">
                  哄哄模拟器
                </Link>{" "}
                练习一下吧！
              </p>
            </div>
          </article>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-gray-500">文章不存在</p>
            <Link
              href="/blog"
              className="mt-4 inline-block text-pink-500 hover:text-pink-600"
            >
              返回攻略列表
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
