"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Settings, User } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  timestamp: Date;
  icon: React.ReactNode;
}

const mockLogs: ActivityLog[] = [
  {
    id: "1",
    action: "Changed password",
    timestamp: new Date(),
    icon: <Settings className="h-4 w-4" />,
  },
  {
    id: "2",
    action: "Updated profile information",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    icon: <User className="h-4 w-4" />,
  },
  // Add more mock logs...
];

export function ActivityLog() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {mockLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 text-sm border-b pb-4 last:border-0"
              >
                <div className="p-2 bg-muted rounded-full">{log.icon}</div>
                <div className="flex-1">
                  <p>{log.action}</p>
                  <p className="text-muted-foreground">
                    {format(log.timestamp, "PPp")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
