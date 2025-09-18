import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function UserIcon({ name, size = 24, className }: UserIconProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10",
        className
      )}
      title={name}
    >
      <User className="w-4 h-4 text-primary" />
    </div>
  );
}
