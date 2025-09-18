"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { useEffect } from "react";

interface DateRangeWithPresetProps {
  selected?: DateRange | null;
  onSelect?: (date?: DateRange | null) => void;
  noInitialDate?: boolean;
}

// CUSTOM DATE RANGE PICKER WITH PRESENT

export default function DateRangeWithPreset({
  selected,
  onSelect,
  noInitialDate = false,
}: DateRangeWithPresetProps) {
  const today = useMemo(() => new Date(), []);
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  };
  const last7Days = useMemo(
    () => ({
      from: subDays(today, 6),
      to: today,
    }),
    [today]
  );
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  };
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  };
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  };
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  };
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  };
  const [month, setMonth] = useState(today);
  const [date, setDate] = useState<DateRange | undefined>(
    selected || (noInitialDate ? undefined : last7Days)
  );

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      setDate(selected || (noInitialDate ? undefined : last7Days));
    }

    return () => {
      mounted = false;
    };
  }, [selected, noInitialDate, last7Days]);

  const handleSelect = (newDate?: DateRange) => {
    // Only update if both dates are selected or if clearing the selection
    if (!newDate || (newDate.from && newDate.to)) {
      setDate(newDate);
      onSelect?.(newDate);
    } else if (newDate.from) {
      // If only start date is selected, set both to the same date
      const completeRange = { from: newDate.from, to: newDate.from };
      setDate(completeRange);
      onSelect?.(completeRange);
    }
  };
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 pointer-events-auto"
          align="start"
        >
          <div className="flex">
            <div className="border-r p-2">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    handleSelect({ from: today, to: today });
                    setMonth(today);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    handleSelect(yesterday);
                    setMonth(yesterday.to);
                  }}
                >
                  Yesterday
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    handleSelect(last7Days);
                    setMonth(last7Days.to);
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(last30Days);
                    setMonth(last30Days.to);
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(monthToDate);
                    setMonth(monthToDate.to);
                  }}
                >
                  Month to date
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(lastMonth);
                    setMonth(lastMonth.to);
                  }}
                >
                  Last month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(yearToDate);
                    setMonth(yearToDate.to);
                  }}
                >
                  Year to date
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(lastYear);
                    setMonth(lastYear.to);
                  }}
                >
                  Last year
                </Button>
              </div>
            </div>
            <Calendar
              mode="range"
              selected={date}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={1}
              disabled={[{ after: today }]}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
