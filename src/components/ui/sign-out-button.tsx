"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { clearAppOwnedLocalStorage } from "@/lib/utils/localStorage-utils";

export function SignOutButton() {
  const handleSignOut = async () => {
    clearAppOwnedLocalStorage();
    await signOut({ callbackUrl: "/", redirect: true });
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-100"
      onClick={handleSignOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
