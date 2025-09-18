"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignInButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

export function SignInButton({
  className = "bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none gap-1.5",
  variant = "default",
  size = "default",
  showIcon = true,
  showText = true,
}: SignInButtonProps) {
  return (
    <a href="/auth/signin" style={{ textDecoration: "none" }}>
      <Button className={className} variant={variant} size={size}>
        {showIcon && <LogIn className="h-4 w-4" />}
        {showText && (
          <span className={showIcon ? "hidden sm:inline-block" : ""}>
            Sign In
          </span>
        )}
      </Button>
    </a>
  );
}
