import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminShellProps = {
  children: React.ReactNode;
  currentUser: {
    username: string;
    accessDenied: boolean;
  };
};

export function AdminShell({ children, currentUser }: AdminShellProps) {
  if (currentUser.accessDenied) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldAlert className="size-5 text-destructive" />
                无管理员权限
              </CardTitle>
              <CardDescription>
                当前账号已登录，但没有后台访问权限。请在环境变量中配置
                `ADMIN_USERNAMES`，或使用管理员账号登录。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium"
              >
                返回首页
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                切换账号
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border bg-background p-4 shadow-sm lg:block">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Admin
            </p>
            <h2 className="mt-2 text-lg font-semibold">后台管理</h2>
          </div>
          <AdminNav />
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border bg-background px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">管理员后台</p>
                <h1 className="text-xl font-semibold tracking-tight">运营控制台</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{currentUser.username}</p>
                  <p className="text-xs text-muted-foreground">管理员已登录</p>
                </div>
                <AdminLogoutButton />
              </div>
            </div>
            <div className="mt-4 lg:hidden">
              <AdminNav />
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
