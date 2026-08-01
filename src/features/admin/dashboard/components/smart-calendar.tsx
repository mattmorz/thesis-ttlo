"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
} from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function SmartCalendar() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch events from the calendar API
  const { data: events } = trpc.calendar.getEvents.useQuery();

  // Get events for the selected date
  const selectedDayEvents =
    events?.filter((event) =>
      isSameDay(new Date(event.startDate), selectedDate)
    ) || [];

  // Get today's events
  const todayEvents =
    events?.filter((event) => isToday(new Date(event.startDate))) || [];

  // Get upcoming events (next 7 days)
  const upcomingEvents =
    events?.filter(
      (event) =>
        new Date(event.startDate) > new Date() &&
        new Date(event.startDate) <= addDays(new Date(), 7)
    ) || [];

  const getEventTypeBadge = (type: string | null) => {
    if (!type) return "bg-gray-100 text-gray-800 border-gray-200";

    switch (type) {
      case "Meeting":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Deadline":
        return "bg-red-100 text-red-800 border-red-200";
      case "Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Function to generate calendar days for current month view
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Create day cells
    const daysByWeek: Array<Array<Date | null>> = [];
    let week: Array<Date | null> = [];

    // Add empty cells for days before the first day of the month
    const firstDayOfMonth = getDay(monthStart);
    for (let i = 0; i < firstDayOfMonth; i++) {
      week.push(null);
    }

    // Add the days of the month
    days.forEach((day) => {
      if (week.length === 7) {
        daysByWeek.push(week);
        week = [];
      }
      week.push(day);
    });

    // Add empty cells for days after the last day of the month
    while (week.length < 7) {
      week.push(null);
    }

    // Add the last week if it's not empty
    if (week.length > 0) {
      daysByWeek.push(week);
    }

    return daysByWeek;
  };

  const calendarDays = generateCalendarDays();

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Check if a day has events
  const hasEvents = (day: Date | null) => {
    if (!day || !events) return false;
    return events.some((event) => isSameDay(new Date(event.startDate), day));
  };

  // Format the month/year display
  const monthYearDisplay = format(currentMonth, "MMMM yyyy");

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-2">
          <div>
            <CardTitle className="text-primary flex items-center gap-2">
              <CalendarIcon className="size-5" />
              Calendar
            </CardTitle>
            <CardDescription className="text-sm">
              Your upcoming schedule and events
            </CardDescription>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/calendar">
            Full Calendar
            <ChevronRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {/* Calendar section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-medium">{monthYearDisplay}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="uppercase text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.flat().map((day, i) => {
                const isSelected = day && isSameDay(day, selectedDate);
                const isToday = day && isSameDay(day, new Date());
                const dayHasEvents = day && hasEvents(day);

                return (
                  <div
                    key={i}
                    className="h-10 text-center relative flex items-center justify-center"
                  >
                    <div
                      onClick={() => day && setSelectedDate(day)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted hover:cursor-pointer",
                        ((isSelected && isToday) || isSelected) &&
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        isToday &&
                          !isSelected &&
                          "bg-accent text-accent-foreground",
                        !day && "hover:bg-inherit hover:cursor-default"
                      )}
                    >
                      {day ? format(day, "d") : ""}
                    </div>
                    {dayHasEvents && (
                      <div
                        className={cn(
                          "absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary",
                          isSelected && "bg-white"
                        )}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Events Section */}
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <h3 className="text-sm font-medium">Today&apos;s Events</h3>
            </div>

            {todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <p className="font-medium text-sm">{event.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.startDate), "h:mm a")}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize text-xs",
                          getEventTypeBadge(event.eventType)
                        )}
                      >
                        {event.eventType || "Event"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-gray-50 text-center text-sm text-muted-foreground">
                No events today
              </div>
            )}
          </div>

          {/* Upcoming Events Section */}
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="text-sm font-medium">Upcoming (Next 7 Days)</h3>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.eventId}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <p className="font-medium text-sm">{event.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.startDate), "MMM d, h:mm a")}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize text-xs",
                          getEventTypeBadge(event.eventType)
                        )}
                      >
                        {event.eventType || "Event"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-gray-50 text-center text-sm text-muted-foreground">
                No upcoming events
              </div>
            )}
          </div>

          {/* Selected Date Events Section */}
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <h3 className="text-sm font-medium">
                Selected Date: {format(selectedDate, "MMMM d, yyyy")}
              </h3>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <p className="font-medium text-sm">{event.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.startDate), "h:mm a")}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize text-xs",
                          getEventTypeBadge(event.eventType)
                        )}
                      >
                        {event.eventType || "Event"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-gray-50 text-center text-sm text-muted-foreground">
                No events scheduled for this date
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t py-3 px-6">
        <div className="flex space-x-2">&nbsp;</div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/admin/calendar">Add Event</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
