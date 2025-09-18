"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimePickerInput({
  value,
  onChange,
  className,
}: TimePickerInputProps) {
  const [hours, minutes] = value.split(":").map(Number);

  const updateTime = (newHours: number, newMinutes: number) => {
    const formattedHours = newHours.toString().padStart(2, "0");
    const formattedMinutes = newMinutes.toString().padStart(2, "0");
    onChange(`${formattedHours}:${formattedMinutes}`);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        <Select
          value={hours.toString()}
          onValueChange={(newHours) => updateTime(parseInt(newHours), minutes)}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="mx-2">:</span>
        <Select
          value={minutes.toString()}
          onValueChange={(newMinutes) =>
            updateTime(hours, parseInt(newMinutes))
          }
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          const now = new Date();
          updateTime(now.getHours(), now.getMinutes());
        }}
      >
        <Clock className="h-4 w-4" />
        <span className="sr-only">Set current time</span>
      </Button>
    </div>
  );
}
