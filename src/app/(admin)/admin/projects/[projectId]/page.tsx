"use client";

import { EmptyData } from "@/components/global/empty-data";
import { Skeleton } from "@/components/ui/skeleton";
import { MainContent } from "@/features/admin/client-project-dashboard/components/MainContent";
import { ProjectHeader } from "@/features/admin/client-project-dashboard/components/project/ProjectHeader";
import { trpc } from "@/trpc/client";

interface PageProps {
  params: { projectId: string };
}

export default function ClientProjectDashboard({ params }: PageProps) {
  const { data, isPending } = trpc.clientProjectDashboard.get.useQuery(params);

  const isArchived = data?.archives[0] !== undefined ? true : false;
  console.log("isArchived", isArchived);

  return (
    <div className="p-6 space-y-4">
      {isPending && (
        <div className="space-y-4">
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
      )}
      {!data && !isPending && (
        <div className="min-h-[calc(100dvh-50px)] w-full flex justify-center items-center">
          <EmptyData text="Project not found or archived." />
        </div>
      )}
      {data && !isPending && (
        <>
          <ProjectHeader
            project={data}
            isArchived={isArchived}
            archiveReason={data?.archives[0]?.archiveReason ?? ""}
          />

          <div>
            {data && (
              <MainContent
                isArchived={isArchived}
                applicationId={data.id}
                phases={data.applicationPhases ?? []}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
