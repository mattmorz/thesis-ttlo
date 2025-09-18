import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

interface LoadingSpinnerProps {
  containerClassName?: string;
  loaderClassName?: string;
}

export function LoadingSpinner({
  containerClassName,
  loaderClassName,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "size-full flex justify-center items-center p-10",
        containerClassName
      )}
    >
      <LoaderCircle
        className={cn(
          "animate-spin size-8 text-muted-foreground",
          loaderClassName
        )}
      />
    </div>
  );
}
