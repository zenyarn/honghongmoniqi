import Link from "next/link";
import { Search } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminStatusDialog } from "@/components/admin/admin-status-dialog";
import { ADMIN_PAGE_SIZE, getRecordsPage, RECORD_STATUS_OPTIONS } from "@/lib/admin/data";
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = readPageParam(params.page);
  const query = readSearchParam(params.q).trim();
  const status = readSearchParam(params.status, "all");

  const { rows, total } = await getRecordsPage({
    page,
    query,
    status,
  });

  const pageCount = getPageCount(total, ADMIN_PAGE_SIZE);
  const safePage = Math.min(page, pageCount);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="订单管理"
        description="真实项目中没有 orders 表，因此此页面按 game_records 做订单式管理：ID 映射订单号，result 映射订单状态。"
      />

      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>
            支持按记录 ID、用户名和场景关键词搜索；当前 schema 没有用户邮箱和订单金额字段。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="搜索记录 ID / 用户名 / 场景"
                className="pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="all">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
            <Button type="submit">查询</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
          <CardDescription>共 {total} 条记录</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="size-5" />
                </EmptyMedia>
                <EmptyTitle>没有匹配的订单记录</EmptyTitle>
                <EmptyDescription>当前筛选条件下没有数据。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>记录 ID</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>场景</TableHead>
                    <TableHead>得分</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.id}</TableCell>
                      <TableCell>{record.users?.username ?? "--"}</TableCell>
                      <TableCell>{record.scenario}</TableCell>
                      <TableCell>{record.final_score}</TableCell>
                      <TableCell>
                        <AdminStatusBadge type="record" value={record.result} />
                      </TableCell>
                      <TableCell>{formatDateTime(record.played_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/orders/${record.id}`}>查看详情</Link>
                          </Button>
                          <AdminStatusDialog
                            title={`编辑记录 #${record.id} 状态`}
                            description="订单状态实际复用 game_records.result 字段，只遵循 success / failed 两个现有枚举。"
                            endpoint={`/api/admin/orders/${record.id}/status`}
                            value={record.result}
                            options={RECORD_STATUS_OPTIONS.map((option) => ({
                              value: option,
                              label: option === "success" ? "成功" : "失败",
                            }))}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <AdminPagination
                pathname="/admin/orders"
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
