"use client";

import React from "react";
import { parseDate } from "chrono-node";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ActiveModifiers } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

/* -------------------------------------------------------------------------- */
/*                               Inspired By:                                 */
/*                               @steventey                                   */
/* ------------------https://dub.co/blog/smart-datetime-picker--------------- */
/* -------------------------------------------------------------------------- */

/**
 * Utility function that parses dates.
 * Parses a given date string using the `chrono-node` library.
 *
 * @param str - A string representation of a date and time.
 * @returns A `Date` object representing the parsed date and time, or `null` if the string could not be parsed.
 */
export const parseDateTime = (str: Date | string) => {
  if (str instanceof Date) return str;
  return parseDate(str);
};

/**
 * Converts a given timestamp or the current date and time to a string representation in the local time zone.
 * format: `HH:mm`, adjusted for the local time zone.
 *
 * @param timestamp {Date | string}
 * @returns A string representation of the timestamp
 */
export const getDateTimeLocal = (timestamp?: Date): string => {
  const d = timestamp ? new Date(timestamp) : new Date();
  if (d.toString() === "Invalid Date") return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split(":")
    .slice(0, 2)
    .join(":");
};

/**
 * Returns the earliest date (starting with today) that is not disabled by the matcher.
 * If no dates are `disabled`, we default to new Date().
 *
 * @param disabled - A boolean disabling the entire input, or a matcher function for valid dates.
 * @returns A `Date` object representing the earliest valid date.
 */
const getValidBaseDate = (
  disabled?: boolean | ((date: Date) => boolean)
): Date => {
  if (typeof disabled !== "function") return new Date();
  let potential = new Date();
  const MAX_DAYS = 365;
  for (let i = 0; i < MAX_DAYS; i++) {
    if (!disabled(potential)) {
      return potential;
    }
    potential = new Date(potential.getTime());
    potential.setDate(potential.getDate() + 1);
  }
  return new Date();
};

/**
 * Formats a given date and time object or string into a human-readable string representation.
 * "MMM D, YYYY h:mm A" (e.g. "Jan 1, 2023 12:00 PM").
 *
 * @param datetime - {Date | string}
 * @returns A string representation of the date and time
 */
export const formatDateTime = (datetime: Date | string) => {
  return new Date(datetime).toLocaleTimeString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

const inputBase =
  "bg-transparent focus:outline-none focus:ring-0 focus-within:outline-none focus-within:ring-0 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50";

// @source: https://www.perplexity.ai/search/in-javascript-how-RfI7fMtITxKr5c.V9Lv5KA#1
// use this pattern to validate the transformed date string for the natural language input
const naturalInputValidationPattern =
  "^[A-Z][a-z]{2}sd{1,2},sd{4},sd{1,2}:d{2}s[AP]M$";

const DEFAULT_SIZE = 96;

/**
 * Smart time input Docs: {@link: https://shadcn-extension.vercel.app/docs/smart-time-input}
 */

interface SmartDatetimeInputProps {
  value?: Date;
  onValueChange: (date: Date) => void;
  disabled?: boolean | ((date: Date) => boolean);
  placeholder?: string;
}

interface SmartDatetimeInputContextProps extends SmartDatetimeInputProps {
  Time: string;
  onTimeChange: (time: string) => void;
}

const SmartDatetimeInputContext =
  React.createContext<SmartDatetimeInputContextProps | null>(null);

const useSmartDateInput = () => {
  const context = React.useContext(SmartDatetimeInputContext);
  if (!context) {
    throw new Error(
      "useSmartDateInput must be used within SmartDateInputProvider"
    );
  }
  return context;
};

export const SmartDatetimeInput = React.forwardRef<
  HTMLInputElement,
  Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "disabled" | "type" | "ref" | "value" | "defaultValue" | "onBlur"
  > &
    SmartDatetimeInputProps
>(
  (
    { className, value, onValueChange, placeholder, disabled, ...props },
    ref
  ) => {
    const [Time, setTime] = React.useState<string>("");

    const onTimeChange = React.useCallback((time: string) => {
      setTime(time);
    }, []);

    return (
      <SmartDatetimeInputContext.Provider
        value={{
          value,
          onValueChange,
          Time,
          onTimeChange,
          disabled,
          placeholder,
        }}
      >
        <div className="flex items-center justify-center">
          <div
            className={cn(
              "flex gap-1 w-full p-1 items-center justify-between rounded-md border transition-all",
              "focus-within:outline-0 focus:outline-0 focus:ring-0",
              "placeholder:text-muted-foreground focus-visible:outline-0 ",
              className
            )}
          >
            <DateTimeLocalInput disabled={disabled} />
            <NaturalLanguageInput
              placeholder={placeholder}
              disabled={typeof disabled === "boolean" ? disabled : false}
              ref={ref}
            />
          </div>
        </div>
      </SmartDatetimeInputContext.Provider>
    );
  }
);

SmartDatetimeInput.displayName = "DatetimeInput";

// Time picker component for selecting hours and minutes
const TimePicker = () => {
  const { value, onValueChange, Time, onTimeChange, disabled } =
    useSmartDateInput();
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const timestamp = 15;

  const formateSelectedTime = React.useCallback(
    (time: string, hour: number, partStamp: number) => {
      onTimeChange(time);

      const base = value ? new Date(value) : getValidBaseDate(disabled);
      const newVal = parseDateTime(base);

      if (!newVal) return;

      newVal.setHours(
        hour,
        partStamp === 0 ? parseInt("00") : timestamp * partStamp
      );

      onValueChange(newVal);
    },
    [value, onValueChange, onTimeChange, disabled]
  );

  const times = React.useMemo(() => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += timestamp) {
        let period = hour < 12 ? "AM" : "PM";
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12;
        times.push(
          `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`
        );
      }
    }
    return times;
  }, []);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex gap-1 items-center text-xs text-muted-foreground p-1">
        <span>Time</span>
      </div>
      <ScrollArea className="h-56 rounded-md">
        <div className="flex flex-col gap-1">
          {times.map((time, index) => {
            const [timeStr, period] = time.split(" ");
            const [hourStr, minuteStr] = timeStr.split(":");
            let hour = parseInt(hourStr);
            if (period === "PM" && hour !== 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;
            const minute = parseInt(minuteStr);
            const partStamp = minute / timestamp;

            return (
              <Button
                key={time}
                type="button"
                variant="ghost"
                disabled={typeof disabled === "boolean" ? disabled : false}
                className={cn(
                  "py-1.5 px-2 h-auto justify-start font-normal",
                  Time === time && "bg-muted"
                )}
                onClick={() => formateSelectedTime(time, hour, partStamp)}
              >
                {time}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

// Input field for natural language date entry
const NaturalLanguageInput = React.forwardRef<
  HTMLInputElement,
  {
    placeholder?: string;
    disabled?: boolean;
  }
>(({ placeholder, ...props }, ref) => {
  const { value, onValueChange, Time, onTimeChange, disabled } =
    useSmartDateInput();

  const _placeholder = placeholder ?? 'e.g. "tomorrow at 5pm" or "in 2 hours"';

  const [inputValue, setInputValue] = React.useState<string>("");

  React.useEffect(() => {
    const hour = new Date().getHours();
    const timeVal = `${hour >= 12 ? hour % 12 : hour}:${new Date()
      .getMinutes()
      .toString()
      .padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
    setInputValue(value ? formatDateTime(value) : "");
    onTimeChange(value ? Time : timeVal);
  }, [value, Time, onTimeChange]);

  const handleParse = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // parse the date string when the input field loses focus
      const parsedDateTime = parseDateTime(e.currentTarget.value);
      if (parsedDateTime) {
        // If a matcher function was passed, prevent selecting a disabled (past) date
        if (
          disabled &&
          typeof disabled != "boolean" &&
          disabled(parsedDateTime)
        ) {
          // Invalid input--time already passed
          return;
        }
        const PM_AM = parsedDateTime.getHours() >= 12 ? "PM" : "AM";

        const PM_AM_hour = parsedDateTime.getHours();

        const hour =
          PM_AM_hour > 12
            ? PM_AM_hour % 12
            : PM_AM_hour === 0 || PM_AM_hour === 12
            ? 12
            : PM_AM_hour;

        onValueChange(parsedDateTime);
        setInputValue(formatDateTime(parsedDateTime));
        onTimeChange(
          `${hour}:${parsedDateTime
            .getMinutes()
            .toString()
            .padStart(2, "0")} ${PM_AM}`
        );
      }
    },
    [onValueChange, onTimeChange, disabled]
  );

  const handleKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const parsedDateTime = parseDateTime(e.currentTarget.value);
        if (parsedDateTime) {
          if (
            disabled &&
            typeof disabled != "boolean" &&
            disabled(parsedDateTime)
          ) {
            return;
          }
          const PM_AM = parsedDateTime.getHours() >= 12 ? "PM" : "AM";

          const PM_AM_hour = parsedDateTime.getHours();

          const hour =
            PM_AM_hour > 12
              ? PM_AM_hour % 12
              : PM_AM_hour === 0 || PM_AM_hour === 12
              ? 12
              : PM_AM_hour;

          onValueChange(parsedDateTime);
          setInputValue(formatDateTime(parsedDateTime));
          onTimeChange(
            `${hour}:${parsedDateTime
              .getMinutes()
              .toString()
              .padStart(2, "0")} ${PM_AM}`
          );
        }
      }
    },
    [onValueChange, onTimeChange, disabled]
  );

  return (
    <Input
      ref={ref}
      type="text"
      placeholder={_placeholder}
      value={inputValue}
      onChange={(e) => setInputValue(e.currentTarget.value)}
      onKeyDown={handleKeydown}
      onBlur={handleParse}
      className={cn("px-2 mr-0.5 flex-1 border-none h-8 rounded", inputBase)}
      {...props}
    />
  );
});

NaturalLanguageInput.displayName = "NaturalLanguageInput";

// Calendar popup for date selection
const DateTimeLocalInput = ({
  disabled,
}: {
  disabled?: boolean | ((date: Date) => boolean);
}) => {
  const { value, onValueChange, Time } = useSmartDateInput();

  const formateSelectedDate = React.useCallback(
    (
      date: Date | undefined,
      selectedDate: Date,
      m: ActiveModifiers,
      e: React.MouseEvent
    ) => {
      if (typeof disabled === "boolean" && disabled) return;
      if (typeof disabled === "function" && disabled(selectedDate)) return;

      const parsedDateTime = parseDateTime(selectedDate);
      if (parsedDateTime) {
        const [timeStr, period] = Time.split(" "); // "9:00 AM" -> ["9:00", "AM"]
        let [hours, minutes] = timeStr.split(":").map(Number); // ["9", "00"] -> [9, 0]

        // Convert to 24-hour format if PM
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        parsedDateTime.setHours(hours, minutes);
        onValueChange(parsedDateTime);
      }
    },
    [value, Time, onValueChange, disabled]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={typeof disabled === "boolean" ? disabled : false}
          variant="outline"
          size="icon"
          className={cn(
            "size-9 flex items-center justify-center font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4" />
          <span className="sr-only">calendar</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" sideOffset={8}>
        <div className="flex gap-1">
          <Calendar
            disabled={disabled}
            id="calendar"
            className="peer flex justify-end"
            mode="single"
            selected={value}
            onSelect={formateSelectedDate}
            initialFocus
          />
          <TimePicker />
        </div>
      </PopoverContent>
    </Popover>
  );
};

DateTimeLocalInput.displayName = "DateTimeLocalInput";
