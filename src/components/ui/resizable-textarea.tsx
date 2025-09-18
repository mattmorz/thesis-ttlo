"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "./textarea";

interface ResizableTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export const ResizableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ResizableTextareaProps
>(({ className, minRows = 3, maxRows = 10, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;
    const scrollHeight = textarea.scrollHeight;

    textarea.style.height = `${Math.min(
      Math.max(minHeight, scrollHeight),
      maxHeight
    )}px`;
  };

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [props.value]);

  return (
    <Textarea
      {...props}
      ref={(node) => {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            node;
        }
        if (textareaRef) {
          (
            textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>
          ).current = node;
        }
      }}
      className={cn("resize-none overflow-hidden", className)}
      onInput={handleResize}
    />
  );
});

ResizableTextarea.displayName = "ResizableTextarea";
