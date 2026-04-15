import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminStatusDialog } from "@/components/admin/admin-status-dialog";
import { getRecordDetail, RECORD_STATUS_OPTIONS } from "@/lib/admin/data";
import { formatDateTime } from "@/lib/admin/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recordId = Number(id);

  if (!Number.isFinite(recordId)) {
    notFound();
  }

  const record = await getRecordDetail(recordId);

  if (!record) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`订单详情 #${record.id}`}
        description="当前详情页基于 game_records 真实字段展示。"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">记录 ID</p>
              <p className="font-medium">{record.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">状态</p>
              <AdminStatusBadge type="record" value={record.result} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">关联用户</p>
              <p className="font-medium">{record.users?.username ?? "--"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">用户 ID</p>
              <p className="font-medium">{record.user_id ?? "--"}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">场景</p>
              <p className="font-medium">{record.scenario}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">得分</p>
              <p className="font-medium">{record.final_score}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">创建时间</p>
              <p className="font-medium">{formatDateTime(record.played_at)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>可执行操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AdminStatusDialog
              title={`编辑记录 #${record.id} 状态`}
              description="此处直接更新 game_records.result。"
              endpoint={`/api/admin/orders/${record.id}/status`}
              value={record.result}
              options={RECORD_STATUS_OPTIONS.map((option) => ({
                value: option,
                label: option === "success" ? "成功" : "失败",
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
