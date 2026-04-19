import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/auth/session";
import { query, queryOne } from "@/storage/database/neon-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, turnstileToken } = body as {
      username?: string;
      password?: string;
      turnstileToken?: string;
    };

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    // 验证用户名格式（3-20位字母数字下划线）
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "用户名格式不正确（3-20位字母、数字或下划线）" },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少6位" },
        { status: 400 }
      );
    }

    const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecretKey) {
      console.error("Register error: TURNSTILE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "人机验证配置缺失，请联系管理员" },
        { status: 500 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "请先完成人机验证" },
        { status: 400 }
      );
    }

    const existingUser = await queryOne<{ id: number }>(
      "select id from users where username = $1 limit 1",
      [username]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "用户名已存在" },
        { status: 409 }
      );
    }

    // 去 Cloudflare 验证这个 token 是不是真的
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecretKey,
          response: turnstileToken,
          remoteip: request.headers.get("x-forwarded-for") ?? undefined,
        }),
      }
    );

    const verifyResult = (await verifyResponse.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    // 如果验证失败，直接拒绝
    if (!verifyResult.success) {
      console.error("Turnstile verification failed", {
        errorCodes: verifyResult["error-codes"] ?? [],
      });
      return NextResponse.json(
        { error: "人机验证失败，请重试" },
        { status: 403 }
      );
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await query<{
      id: number;
      username: string;
      status: string;
      created_at: string | null;
    }>(
      `insert into users (username, password, status)
       values ($1, $2, $3)
       returning id, username, status, created_at`,
      [username, hashedPassword, "active"]
    );
    const data = result.rows[0] ?? null;

    if (!data) {
      return NextResponse.json(
        { error: "注册失败" },
        { status: 500 }
      );
    }

    await createSessionCookie({
      id: data.id,
      username: data.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        status: data.status,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
