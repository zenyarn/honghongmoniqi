"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>后台页面加载失败</CardTitle>
        <CardDescription>
          数据获取时发生错误，请稍后重试。如果问题持续存在，请检查数据库连接或管理员权限配置。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          重新加载
        </Button>
      </CardContent>
    </Card>
  );
}
