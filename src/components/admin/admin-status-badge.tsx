import { Badge } from "@/components/ui/badge";

type AdminStatusBadgeProps = {
  type: "user" | "record";
  value: string;
};

export function AdminStatusBadge({ type, value }: AdminStatusBadgeProps) {
  if (type === "user") {
    return (
      <Badge variant={value === "active" ? "default" : "secondary"}>
        {value === "active" ? "启用" : "停用"}
      </Badge>
    );
  }

  return (
    <Badge variant={value === "success" ? "default" : "secondary"}>
      {value === "success" ? "成功" : "失败"}
    </Badge>
  );
}
