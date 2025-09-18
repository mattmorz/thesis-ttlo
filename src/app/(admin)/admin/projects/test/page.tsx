import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function page() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-44 w-full" />
      <div className="flex justify-between w-full">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="flex items-center justify-between w-full pb-4">
        <Skeleton className="h-16 w-60" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full" />

        <Skeleton className="h-40 w-full" />

        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
