import { cn } from "@/lib/utils";

interface EmptyDataProps {
  className?: string;
  text?: string;
}
export function EmptyData({ className, text = "No results." }: EmptyDataProps) {
  return (
    <div
      className={cn(
        "size-full p-10 text-center text-muted-foreground",
        className
      )}
    >
      <p>{text}</p>
    </div>
  );
}
