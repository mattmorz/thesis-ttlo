"use client";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

interface DateInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  const id = useId();
  const [month, setMonth] = useState(value || new Date());
  const [date, setDate] = useState<Date | undefined>(value);
  const [inputValue, setInputValue] = useState(
    value ? format(value, "dd/MM/yyyy") : ""
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleDayPickerSelect = (date: Date | undefined) => {
    if (!date) {
      setInputValue("");
      setDate(undefined);
      onChange?.(undefined);
    } else {
      setDate(date);
      setMonth(date);
      setInputValue(format(date, "dd/MM/yyyy"));
      onChange?.(date);
    }
    setIsOpen(false);
  };

  const formatDateInput = (value: string) => {
    // Remove any non-digit characters
    const numbers = value.replace(/\D/g, "");

    // Format the string based on length
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(
        4,
        8
      )}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatDateInput(rawValue);
    setInputValue(formattedValue);

    // Only try to parse if we have a complete date
    if (formattedValue.length === 10) {
      try {
        const [day, month, year] = formattedValue.split("/");
        if (day && month && year && year.length === 4) {
          const parsedDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
          );
          if (
            !isNaN(parsedDate.getTime()) &&
            parsedDate <= new Date() &&
            parsedDate >= new Date("1900-01-01")
          ) {
            setDate(parsedDate);
            setMonth(parsedDate);
            onChange?.(parsedDate);
          }
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    } else if (!formattedValue) {
      setDate(undefined);
      onChange?.(undefined);
    }
  };

  useEffect(() => {
    if (value) {
      const formattedDate = format(value, "dd/MM/yyyy");
      setInputValue(formattedDate);
      setDate(value);
      setMonth(value);
    } else {
      setInputValue("");
      setDate(undefined);
    }
  }, [value]);

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative">
          <Input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="DD/MM/YYYY"
            className="pl-9"
            maxLength={10}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute inset-y-0 left-0 flex items-center justify-center px-2 text-muted-foreground hover:text-foreground"
              aria-label="Open calendar"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDayPickerSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
            className="rounded-md border bg-popover"
            classNames={{
              months:
                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "relative flex items-center justify-center pt-1",
              caption_label: "text-sm font-medium",
              nav: "flex items-center space-x-1 bg-transparent",
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm relative p-0 hover:bg-accent",
              day: "h-9 w-9 p-0 font-normal",
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "opacity-50",
              day_disabled: "opacity-50 cursor-not-allowed",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
