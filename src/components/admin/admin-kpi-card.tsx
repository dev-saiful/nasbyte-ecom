import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminKpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
}

export function AdminKpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: AdminKpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
            {trend !== undefined && trend !== 0 && (
              <span
                className={
                  trend > 0 ? "ml-1 text-green-600" : "ml-1 text-red-600"
                }
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
