"use client";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO,
  differenceInDays,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { useState } from "react";
import type { Event } from "@/components/blocks/event-calendar/types";
import { EVENT_TYPE_COLORS } from "@/components/blocks/event-calendar/types";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader, X } from "lucide-react";

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function MonthView({
  currentDate,
  events,
  onEventClick,
}: MonthViewProps) {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // Get days for the current month view (including days from prev/next months to fill the grid)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Process events for each day
  const eventsByDate: Record<string, Event[]> = {};

  days.forEach((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    eventsByDate[dateKey] = [];

    // Get start of day and end of day
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    // Find events that occur on this day
    events.forEach((event) => {
      const eventStart =
        typeof event.startDate === "string"
          ? parseISO(event.startDate)
          : event.startDate;
      const eventEnd =
        typeof event.endDate === "string"
          ? parseISO(event.endDate)
          : event.endDate;

      // Check if event occurs on this day
      if (
        isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(eventStart, { start: dayStart, end: dayEnd })
      ) {
        // Create a copy of the event with additional metadata
        const isMultiDay = differenceInDays(eventEnd, eventStart) >= 1;
        const isStart = isSameDay(dayStart, eventStart);
        const isEnd = isSameDay(dayEnd, eventEnd);

        eventsByDate[dateKey].push({
          ...event,
          isMultiDay,
          isStart,
          isEnd,
        });
      }
    });

    // Sort events - all-day and multi-day events first, then by start time
    eventsByDate[dateKey].sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;

      const aStart =
        typeof a.startDate === "string" ? parseISO(a.startDate) : a.startDate;
      const bStart =
        typeof b.startDate === "string" ? parseISO(b.startDate) : b.startDate;

      return aStart.getTime() - bStart.getTime();
    });
  });

  // Function to render status indicator
  const renderStatusIndicator = (status: Event["status"]) => {
    if (status === "completed") return null;
    if (status === "scheduled") return null;
    if (status === "in-progress") {
      return <Loader className="size-3" />;
    }
    if (status === "cancelled") {
      return <X className="size-3" />;
    }
    return null;
  };

  return (
    <div>
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateKey] || [];
          const popoverId = `popover-${dateKey}`;

          // Limit visible events to 3
          const maxVisibleEvents = 3;
          const visibleEvents = dayEvents.slice(0, maxVisibleEvents);
          const hiddenEventsCount = Math.max(
            0,
            dayEvents.length - maxVisibleEvents
          );

          return (
            <div
              key={day.toString()}
              className={cn(
                "border-b border-r p-1 min-h-[145px] relative",
                !isSameMonth(day, currentDate) &&
                  "bg-muted/50 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "text-sm p-1 font-medium",
                  isToday(day) &&
                    "bg-black text-white rounded-full w-7 h-7 flex items-center justify-center"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="mt-1 space-y-1 max-h-[calc(100%-28px)] overflow-y-auto">
                {visibleEvents.map((event) => {
                  const eventStart =
                    typeof event.startDate === "string"
                      ? parseISO(event.startDate)
                      : event.startDate;
                  const eventEnd =
                    typeof event.endDate === "string"
                      ? parseISO(event.endDate)
                      : event.endDate;

                  // Format start time if not all day and this is the first day
                  const startTime =
                    event.isStart && !event.isAllDay
                      ? format(eventStart, "h:mma")
                      : null;

                  // Format end time if not all day and this is the last day
                  const endTime =
                    event.isEnd && !event.isAllDay && event.isMultiDay
                      ? format(eventEnd, "h:mma")
                      : null;

                  // Get color based on event type
                  const eventColor = EVENT_TYPE_COLORS[event.eventType];

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn(
                        "text-xs p-1 rounded cursor-pointer w-full truncate h-6 flex items-center",
                        eventColor,
                        event.status === "completed" && "line-through"
                      )}
                    >
                      {/* Status indicator */}
                      {event.isStart && (
                        <div className="flex items-center mr-1">
                          {renderStatusIndicator(event.status)}
                        </div>
                      )}

                      {/* Only show text on the first day of multi-day events */}
                      {event.isStart || !event.isMultiDay ? (
                        <>
                          {startTime && (
                            <span className="font-normal opacity-70 sm:text-[11px]">
                              {startTime}&nbsp;
                            </span>
                          )}
                          <span className="truncate pr-px">{event.title}</span>
                        </>
                      ) : event.isEnd && event.isMultiDay && endTime ? (
                        <span className="font-normal opacity-70 sm:text-[11px]">
                          {endTime}
                        </span>
                      ) : (
                        <span className="opacity-0">placeholder</span> // Invisible placeholder to maintain height
                      )}
                    </div>
                  );
                })}

                {/* Show "+ n more" if there are hidden events */}
                {hiddenEventsCount > 0 && (
                  <Popover
                    open={openPopoverId === popoverId}
                    onOpenChange={(open) =>
                      setOpenPopoverId(open ? popoverId : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="focus-visible:border-ring focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-[var(--event-gap)] flex h-[var(--event-height)] w-full items-center overflow-hidden px-1 text-left text-[10px] backdrop-blur-md transition outline-none select-none focus-visible:ring-[3px] sm:px-2 sm:text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        + {hiddenEventsCount}&nbsp;
                        <span className="max-sm:sr-only">more</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-80 p-3" align="center">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          {format(day, "EEE d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((event) => {
                            const eventStart =
                              typeof event.startDate === "string"
                                ? parseISO(event.startDate)
                                : event.startDate;

                            // Format start time if not all day
                            const startTime = !event.isAllDay
                              ? format(eventStart, "h:mma")
                              : null;

                            // Get color based on event type
                            const eventColor =
                              EVENT_TYPE_COLORS[event.eventType];

                            return (
                              <div
                                key={event.id}
                                onClick={() => {
                                  onEventClick(event);
                                  setOpenPopoverId(null);
                                }}
                                className={cn(
                                  "text-xs p-1 rounded cursor-pointer w-full truncate h-6 flex items-center",
                                  eventColor,
                                  event.status === "completed" && "line-through"
                                )}
                              >
                                {/* Status indicator */}
                                {event.isStart && (
                                  <div className="flex items-center mr-1">
                                    {renderStatusIndicator(event.status)}
                                  </div>
                                )}

                                {startTime && (
                                  <span className="font-normal opacity-70 sm:text-[11px]">
                                    {startTime}&nbsp;
                                  </span>
                                )}
                                <span className="truncate pr-px">
                                  {event.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
