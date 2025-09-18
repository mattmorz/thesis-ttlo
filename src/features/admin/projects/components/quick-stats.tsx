"use client";

import { type LucideIcon } from "lucide-react";

interface QuickStatsProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

export default function QuickStats({
  label,
  value,
  icon: Icon,
}: QuickStatsProps) {
  return (
    <div className="flex items-center p-4 bg-card rounded-lg border shadow-sm">
      <div className="p-2 bg-primary/10 rounded-full">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="w-full flex items-center justify-center flex-col">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
