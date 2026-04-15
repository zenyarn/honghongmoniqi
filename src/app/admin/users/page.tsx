import { Search } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminStatusDialog } from "@/components/admin/admin-status-dialog";
import { ADMIN_PAGE_SIZE, getUsersPage, USER_STATUS_OPTIONS } from "@/lib/admin/data";
import { formatDateTime, getPageCount, readPageParam, readSearchParam } from "@/lib/admin/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = readPageParam(params.page);
  const query = readSearchParam(params.q).trim();
  const status = readSearchParam(params.status, "all");

  const { rows, total } = await getUsersPage({
    page,
    query,
    status,
  });

  const pageCount = getPageCount(total, ADMIN_PAGE_SIZE);
  const safePage = Math.min(page, pageCount);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="用户管理"
        description="复用现有 users 表，实现用户列表、搜索、分页和状态编辑。真实 schema 中没有 email/name 字段，因此这里按 username 做映射展示。"
      />

      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>
            当前项目只支持按用户名搜索；email 字段在真实 schema 中不存在，因此不提供 email 检索。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="搜索用户名"
                className="pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="all">全部状态</option>
              <option value="active">启用</option>
              <option value="disabled">停用</option>
            </select>
            <Button type="submit">查询</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>共 {total} 条记录</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="size-5" />
                </EmptyMedia>
                <EmptyTitle>没有匹配的用户</EmptyTitle>
                <EmptyDescription>调整筛选条件后再试一次。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell className="text-muted-foreground">--</TableCell>
                      <TableCell>{formatDateTime(user.created_at)}</TableCell>
                      <TableCell>
                        <AdminStatusBadge type="user" value={user.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminStatusDialog
                          title={`编辑用户 #${user.id} 状态`}
                          description="这里只允许管理员修改最小必要的账号状态字段，不开放敏感字段编辑。"
                          endpoint={`/api/admin/users/${user.id}/status`}
                          value={user.status}
                          options={USER_STATUS_OPTIONS.map((option) => ({
                            value: option,
                            label: option === "active" ? "启用" : "停用",
                          }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <AdminPagination
                pathname="/admin/users"
                page={safePage}
                pageCount={pageCount}
                searchParams={{
                  q: query,
                  status,
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
