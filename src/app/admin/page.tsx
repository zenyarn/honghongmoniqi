import { Activity, Clock3, ScrollText, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminDashboardStats } from "@/lib/admin/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statCards = [
  {
    key: "userCount",
    label: "用户总数",
    description: "当前已注册用户",
    icon: Users,
  },
  {
    key: "newUserCount",
    label: "最近新增用户",
    description: "近 7 天新增",
    icon: Clock3,
  },
  {
    key: "recordCount",
    label: "订单总数",
    description: "按真实 schema 映射为 game_records 总数",
    icon: ScrollText,
  },
  {
    key: "recentRecordCount",
    label: "最近订单数",
    description: "近 7 天新增记录",
    icon: Activity,
  },
] as const;

export default async function AdminOverviewPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="后台概览"
        description="基于当前项目的真实表结构展示核心运营指标，不伪造不存在的订单金额类数据。"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <CardDescription className="mt-2">{item.description}</CardDescription>
              </div>
              <item.icon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {stats[item.key]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>数据说明</CardTitle>
          <CardDescription>
            当前项目没有真实 `orders` 表，因此后台将 `/admin/orders` 适配为 `game_records`
            管理。后续如果补上真实订单表，可以复用当前后台布局和表格结构平滑切换。
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
