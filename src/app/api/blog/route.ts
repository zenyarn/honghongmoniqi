import { NextRequest, NextResponse } from "next/server";
import { invokeLLM } from "@/lib/providers/ark-llm";
import { query, queryOne } from "@/storage/database/neon-client";

interface ArticleListItem {
  id: number;
  title: string;
  summary: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("id");

    // 如果指定了文章ID，返回具体文章内容
    if (articleId) {
      const data = await queryOne<{
        id: number;
        title: string;
        summary: string;
        content: string;
        created_at: string | null;
      }>(
        "select id, title, summary, content, created_at from blog_posts where id = $1 limit 1",
        [Number(articleId)]
      );

      if (!data) {
        return NextResponse.json({ error: "文章不存在" }, { status: 404 });
      }

      return NextResponse.json({
        id: data.id,
        title: data.title,
        summary: data.summary,
        content: data.content,
        createdAt: data.created_at,
      });
    }

    // 返回文章列表
    const { rows } = await query<ArticleListItem>(
      "select id, title, summary from blog_posts order by created_at desc"
    );

    return NextResponse.json({
      articles: rows,
    });
  } catch (error) {
    console.error("Blog API error:", error);
    return NextResponse.json(
      { error: "获取文章失败" },
      { status: 500 }
    );
  }
}

// POST: 生成新文章（LLM驱动）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "请提供文章主题" },
        { status: 400 }
      );
    }

    // 生成文章内容
    const prompt = `你是一个情感博主，请为"${topic}"这个主题写一篇300-500字的公众号文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 有具体的例子或场景
3. 结尾要有实用的建议或总结
4. 不要用markdown格式
5. 不要使用emoji

开始写：`;

    const response = await invokeLLM(
      [{ role: "user", content: prompt }],
      { temperature: 0.8 }
    );

    const content = response.content;

    // 生成摘要（取前100字）
    const summary = content.substring(0, 100) + "...";

    // 生成标题（基于主题扩展）
    const titlePrompt = `根据以下文章主题，生成一个吸引人的标题（15字以内，不要用emoji）：
"${topic}"

直接输出标题，不要任何解释：`;

    const titleResponse = await invokeLLM(
      [{ role: "user", content: titlePrompt }],
      { temperature: 0.5 }
    );

    const title = titleResponse.content.trim();

    const { rows } = await query<{
      id: number;
      title: string;
      summary: string;
      content: string;
      created_at: string | null;
    }>(
      `insert into blog_posts (title, summary, content)
       values ($1, $2, $3)
       returning id, title, summary, content, created_at`,
      [title, summary, content]
    );
    const data = rows[0] ?? null;

    if (!data) {
      throw new Error("保存失败：未返回数据");
    }

    return NextResponse.json({
      id: data.id,
      title: data.title,
      summary: data.summary,
      content: data.content,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("Blog POST error:", error);
    return NextResponse.json(
      { error: "生成文章失败" },
      { status: 500 }
    );
  }
}
