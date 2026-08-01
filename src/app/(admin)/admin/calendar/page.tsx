"use client";
import { Calendar } from "@/components/blocks/event-calendar/calendar";
import { Event } from "@/components/blocks/event-calendar/types";
import { LoadingSpinner } from "@/components/global/loading-spinner";
import { Card } from "@/components/ui";
import { trpc } from "@/trpc/client";

export default function Page() {
  const { data, isPending } = trpc.calendar.getEvents.useQuery();

  const transformedEvents: Event[] = (data || []).map((event: any) => ({
    ...event,
    description: event.description ?? undefined,
    createdAt: event.createdAt ?? undefined,
    updatedAt: event.updatedAt ?? undefined,
    projectId: event.applicationId ?? undefined,
    eventType: event.eventType as Event["eventType"],
    createdBy: event.createdBy ?? undefined,
    otherEventType: event.otherEventType ?? undefined,
    status: event.status as Event["status"],
  }));

  return (
    <div className="block mx-auto p-6">
      <Card className="relative overflow-y-auto max-h-[calc(100vh-48px)]">
        {isPending ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
              <LoadingSpinner loaderClassName="size-14" />
            </div>
            <Calendar />
          </>
        ) : (
          <Calendar initialEvents={transformedEvents} />
        )}
      </Card>
    </div>
  );
}
