"use client";

import * as React from "react";
import { Calendar } from "./calendar";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Label } from "./label";
import { Switch } from "./switch";
import { TimePickerInput } from "./time-picker-input";
import { Card } from "./card";

interface DateTimePickerProps {
  date?: Date;
  setDate?: (date: Date) => void;
  value?: Date;
  onChange?: (date: Date) => void;
  includeTime?: boolean;
  onIncludeTimeChange?: (include: boolean) => void;
}

export function DateTimePicker({
  date,
  setDate,
  value,
  onChange,
  includeTime = false,
  onIncludeTimeChange,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date || value || new Date()
  );
  const [timeValue, setTimeValue] = React.useState(
    format(selectedDate || new Date(), "HH:mm")
  );
  const [showTime, setShowTime] = React.useState(includeTime);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      if (showTime) {
        const [hours, minutes] = timeValue.split(":").map(Number);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
      } else {
        newDate.setHours(0);
        newDate.setMinutes(0);
      }
      setSelectedDate(newDate);
      setDate?.(newDate);
      onChange?.(newDate);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setSelectedDate(newDate);
      setDate?.(newDate);
      onChange?.(newDate);
    }
  };

  const handleIncludeTimeChange = (checked: boolean) => {
    setShowTime(checked);
    onIncludeTimeChange?.(checked);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (!checked) {
        newDate.setHours(0);
        newDate.setMinutes(0);
      }
      setSelectedDate(newDate);
      setDate?.(newDate);
      onChange?.(newDate);
    }
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, showTime ? "PPP p" : "PPP")
            ) : (
              <span>Pick a date{showTime ? " and time" : ""}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-t p-4 space-y-4">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-time" className="text-sm font-medium">
                  Include Time
                </Label>
                <Switch
                  id="include-time"
                  checked={showTime}
                  onCheckedChange={handleIncludeTimeChange}
                  className="ml-2"
                />
              </div>
              {showTime && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Set Time
                  </Label>
                  <TimePickerInput
                    value={timeValue}
                    onChange={handleTimeChange}
                    className="mt-1"
                  />
                </div>
              )}
            </Card>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
