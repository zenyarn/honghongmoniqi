import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/auth/session";
import { queryOne } from "@/storage/database/neon-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const data = await queryOne<{
      id: number;
      username: string;
      password: string;
      status: string;
    }>(
      "select id, username, password, status from users where username = $1 limit 1",
      [username]
    );

    if (!data) {
      return NextResponse.json(
        { error: "用户名不存在" },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, data.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
