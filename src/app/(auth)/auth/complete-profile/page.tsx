"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizePhone = (value: string) =>
    value.replace(/\D/g, "").slice(0, 11);
  const formatPhone = (value: string) => {
    const digits = normalizePhone(value);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    const raw = normalizePhone(value);
    setPhoneNumber(raw);
    setPhoneDisplay(formatPhone(raw));
  };

  useEffect(() => {
    setPhoneDisplay(formatPhone(phoneNumber));
  }, [phoneNumber]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/account/phone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Failed to update phone number");
        return;
      }

      router.replace("/forms?tab=client-profile");
    } catch (err) {
      console.error("[Complete Profile] Update failed:", err);
      setError("Failed to update phone number");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-[#F6FFF5] p-6">
      <Card className="w-full max-w-md border-[#C8E6C9]">
        <CardHeader className="border-b bg-[#FAFFF9]">
          <CardTitle className="text-lg text-[#1B5E20]">
            Complete Your Profile
          </CardTitle>
          <p className="text-sm text-gray-600">
            Please add a valid phone number to continue. This will be used for
            tracking OTP verification.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="09XX XXX XXXX"
              value={phoneDisplay}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onKeyDown={(e) => {
                const allowed =
                  e.key >= "0" && e.key <= "9"
                    ? true
                    : [
                        "Backspace",
                        "Delete",
                        "ArrowLeft",
                        "ArrowRight",
                        "Home",
                        "End",
                        "Tab",
                      ].includes(e.key);
                if (!allowed) e.preventDefault();
              }}
              onBeforeInput={(e) => {
                const data = e.data ?? "";
                if (data && !/^\d+$/.test(data)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (text && !/^\d+$/.test(text)) {
                  e.preventDefault();
                }
              }}
              maxLength={13}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            className="w-full bg-[#1B5E20] hover:bg-[#145018]"
            onClick={handleSubmit}
            disabled={saving || phoneNumber.length !== 11}
          >
            {saving ? "Saving..." : "Save and Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
