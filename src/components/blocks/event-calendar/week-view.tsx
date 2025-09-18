"use client";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isToday,
  differenceInMinutes,
  isBefore,
  isAfter,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isSameDay,
} from "date-fns";
import type { Event } from "@/components/blocks/event-calendar/types";
import { EVENT_TYPE_COLORS } from "@/components/blocks/event-calendar/types";
import { cn } from "@/lib/utils";
import { CircleDot, CircleX, Loader, X } from "lucide-react";

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  // Get days for the current week
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate hours for the day
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Separate all-day and regular events
  const allDayEvents: Array<{
    event: Event;
    startDayIndex: number;
    endDayIndex: number;
    daySpan: number;
  }> = [];

  const regularEvents: Array<{
    event: Event;
    dayIndex: number;
    startMinutes: number;
    durationMinutes: number;
  }> = [];

  events.forEach((event) => {
    const eventStart =
      typeof event.startDate === "string"
        ? parseISO(event.startDate)
        : event.startDate;
    const eventEnd =
      typeof event.endDate === "string"
        ? parseISO(event.endDate)
        : event.endDate;

    // Check if event is within the current week
    const eventStartDay = startOfDay(eventStart);
    const eventEndDay = endOfDay(eventEnd);

    // Check if event overlaps with the week
    if (
      isWithinInterval(eventStartDay, { start: weekStart, end: weekEnd }) ||
      isWithinInterval(eventEndDay, { start: weekStart, end: weekEnd }) ||
      (isBefore(eventStartDay, weekStart) && isAfter(eventEndDay, weekEnd))
    ) {
      // Determine which days of the week the event spans
      const daysInWeek = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        return (
          isWithinInterval(dayStart, {
            start: eventStartDay,
            end: eventEndDay,
          }) ||
          isWithinInterval(dayEnd, {
            start: eventStartDay,
            end: eventEndDay,
          }) ||
          isWithinInterval(eventStartDay, { start: dayStart, end: dayEnd })
        );
      });

      // Find the first and last day of the event in this week
      const firstDayIndex = daysInWeek.findIndex(Boolean);
      const lastDayIndex = daysInWeek.lastIndexOf(true);

      // Check if it's a multi-day event or all-day event
      const isMultiDay = !isSameDay(eventStart, eventEnd) || event.isAllDay;

      if (firstDayIndex !== -1) {
        if (isMultiDay) {
          // Add to all-day events
          allDayEvents.push({
            event,
            startDayIndex: firstDayIndex,
            endDayIndex: lastDayIndex,
            daySpan: lastDayIndex - firstDayIndex + 1,
          });
        } else {
          // Regular event
          const startMinutes =
            eventStart.getHours() * 60 + eventStart.getMinutes();
          const durationMinutes = differenceInMinutes(eventEnd, eventStart);

          regularEvents.push({
            event,
            dayIndex: firstDayIndex,
            startMinutes,
            durationMinutes,
          });
        }
      }
    }
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
    <div className="h-full overflow-y-auto">
      {/* Header row with day names */}
      <div className="sticky top-0 z-10 grid grid-cols-8 border-b bg-background">
        <div className="p-2 text-center text-muted-foreground border-r">
          GMT+8
        </div>
        {days.map((day) => (
          <div
            key={day.toString()}
            className={cn(
              "p-2 text-center border-r",
              isToday(day) ? "font-bold" : "text-muted-foreground"
            )}
          >
            <div>{format(day, "EEE dd")}</div>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="p-2 text-xs text-muted-foreground border-r text-right">
          All day
        </div>
        {days.map((day, dayIndex) => (
          <div
            key={`allday-${day.toString()}`}
            className="relative border-r p-1 space-y-1"
          >
            {allDayEvents
              .filter(
                (item) =>
                  dayIndex >= item.startDayIndex && dayIndex <= item.endDayIndex
              )
              .map((item) => {
                // Get color based on event type
                const eventColor = EVENT_TYPE_COLORS[item.event.eventType];

                // Only show details on the first day
                const isFirstDay = dayIndex === item.startDayIndex;

                // Format time if it's the first day and not an all-day event
                const showTime = isFirstDay && !item.event.isAllDay;
                const startTime = showTime
                  ? format(
                      typeof item.event.startDate === "string"
                        ? parseISO(item.event.startDate)
                        : item.event.startDate,
                      "h:mma"
                    )
                  : null;

                const endTime = showTime
                  ? format(
                      typeof item.event.endDate === "string"
                        ? parseISO(item.event.endDate)
                        : item.event.endDate,
                      "h:mma"
                    )
                  : null;

                return (
                  <div
                    key={`allday-${item.event.id}-day-${dayIndex}`}
                    onClick={() => onEventClick(item.event)}
                    className={cn(
                      "p-1 rounded cursor-pointer text-xs",
                      eventColor,
                      item.event.status === "completed" && "line-through"
                    )}
                  >
                    <div className="font-medium flex items-center truncate gap-1">
                      {isFirstDay ? (
                        <>
                          {renderStatusIndicator(item.event.status)}
                          {item.event.title}
                          {showTime && startTime && endTime && (
                            <span className="ml-1 text-xs opacity-80">
                              {startTime} - {endTime}
                            </span>
                          )}
                        </>
                      ) : (
                        <>&nbsp;</>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-8">
        {/* Time labels column */}
        <div className="col-span-1 border-r">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b text-xs text-muted-foreground pr-2 text-right"
            >
              {hour === 0
                ? "12 AM"
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        {/* Day columns with events */}
        {days.map((day, dayIndex) => (
          <div key={day.toString()} className="col-span-1 relative border-r">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b" />
            ))}

            {/* Regular events */}
            {regularEvents
              .filter((item) => item.dayIndex === dayIndex)
              .map((item) => {
                const top = (item.startMinutes / 60) * 64; // 64px per hour (16px * 4)
                const height =
                  item.durationMinutes < 60
                    ? 46
                    : (item.durationMinutes / 60) * 64; // 64px per hour (16px * 4)

                // Get color based on event type
                const eventColor = EVENT_TYPE_COLORS[item.event.eventType];

                return (
                  <div
                    key={`${item.event.id}-day-${dayIndex}`}
                    onClick={() => onEventClick(item.event)}
                    className={cn(
                      "absolute left-0 right-0 mx-1 p-2 rounded overflow-hidden cursor-pointer text-xs",
                      eventColor,
                      item.event.status === "completed" && "line-through"
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                    }}
                  >
                    <div className="font-medium flex items-start gap-1">
                      {renderStatusIndicator(item.event.status)}
                      {item.event.title}
                    </div>
                    <div>
                      {format(
                        typeof item.event.startDate === "string"
                          ? parseISO(item.event.startDate)
                          : item.event.startDate,
                        "h:mma"
                      )}{" "}
                      -{" "}
                      {format(
                        typeof item.event.endDate === "string"
                          ? parseISO(item.event.endDate)
                          : item.event.endDate,
                        "h:mma"
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
