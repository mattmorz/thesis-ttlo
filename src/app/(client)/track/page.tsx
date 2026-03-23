"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TrackingResponse = {
  application?: {
    id: string;
    title: string;
    status: string;
    progress: number | null;
    ipType: string | null;
    createdAt: string;
    updatedAt: string;
  };
  phases?: Array<{
    phaseId: string;
    title: string;
    status: string;
    startDate: string;
    endDate: string;
    phaseTasks?: Array<{
      taskId: string;
      title: string;
      status: string;
      dueDate: string | null;
      priority: string | null;
    }>;
  }>;
  forms?: Array<{
    sourceType: string;
    status: string;
    updatedAt: string;
  }>;
  activities?: Array<{
    title: string;
    description: string | null;
    createdAt: string;
    userAccount?: { name: string | null };
  }>;
};

export default function Page() {
  const [trackingCode, setTrackingCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(
    null
  );

  const channel: "email" = "email";

  const canSendOtp = useMemo(() => {
    const hasTracking = Boolean(trackingCode.trim());
    return hasTracking && Boolean(identifier.trim());
  }, [trackingCode, identifier]);

  const canVerify = useMemo(() => {
    return Boolean(otpSent && otp.trim().length >= 4);
  }, [otpSent, otp]);

  const sendOtp = async () => {
    setError(null);
    setInfo(null);
    setDevOtp(null);
    setTrackingData(null);
    setSending(true);

    try {
      const response = await fetch("/api/track/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode,
          channel,
          identifier,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setInfo(`OTP sent to ${data?.data?.destination || "your account"}`);
      if (data?.data?.otp) {
        setDevOtp(String(data.data.otp));
      }
    } catch (err) {
      console.error("[Track] OTP send failed:", err);
      setError("Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const verifyTracking = async () => {
    setError(null);
    setInfo(null);
    setVerifying(true);

    try {
      const response = await fetch("/api/track/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode,
          channel,
          identifier,
          otp,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Failed to verify tracking details");
        return;
      }

      setTrackingData(data.data);
    } catch (err) {
      console.error("[Track] Verify failed:", err);
      setError("Failed to verify tracking details");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="py-4 px-5 border-b bg-[#FAFFF9] space-y-2">
          <CardTitle className="text-base font-medium text-[#1B5E20] flex items-center gap-2">
            Track your Application
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter your tracking code, choose where to receive the OTP, and
            verify to see your application progress.
          </p>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tracking Code
            </label>
            <Input
              type="text"
              placeholder="JT-XXXXXX"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] w-full text-sm h-10"
            onClick={sendOtp}
            disabled={!canSendOtp || sending}
          >
            {sending ? "Sending OTP..." : "Send OTP"}
          </Button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OTP Code
            </label>
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center tracking-widest"
            />
          </div>

          <Button
            className="bg-[#1B5E20] hover:bg-[#145018] w-full text-sm h-10"
            onClick={verifyTracking}
            disabled={!canVerify || verifying}
          >
            {verifying ? "Checking..." : "Track Application"}
          </Button>

          {info && <p className="text-sm text-green-700">{info}</p>}
          {devOtp && (
            <p className="text-xs text-amber-700">
              Dev OTP: <span className="font-semibold">{devOtp}</span>
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {trackingData?.application && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="py-4 px-5 border-b bg-[#FAFFF9]">
            <CardTitle className="text-base font-medium text-[#1B5E20]">
              Application Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-wrap justify-between text-sm text-gray-700">
              <span className="font-medium">
                {trackingData.application.title}
              </span>
              <span className="capitalize">
                {trackingData.application.status?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Type:{" "}
              <span className="font-medium">
                {trackingData.application.ipType || "N/A"}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Progress:{" "}
              <span className="font-medium">
                {trackingData.application.progress ?? 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {trackingData?.phases && trackingData.phases.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="py-4 px-5 border-b bg-[#FAFFF9]">
            <CardTitle className="text-base font-medium text-[#1B5E20]">
              Phases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {trackingData.phases.map((phase) => (
              <div
                key={phase.phaseId}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex flex-wrap justify-between text-sm">
                  <span className="font-medium text-gray-800">
                    {phase.title}
                  </span>
                  <span className="capitalize text-gray-600">
                    {phase.status}
                  </span>
                </div>
                {phase.phaseTasks && phase.phaseTasks.length > 0 && (
                  <div className="text-xs text-gray-600">
                    {phase.phaseTasks.filter(
                      (task) => task.status === "completed"
                    ).length}
                    /{phase.phaseTasks.length} tasks completed
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {trackingData?.forms && trackingData.forms.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="py-4 px-5 border-b bg-[#FAFFF9]">
            <CardTitle className="text-base font-medium text-[#1B5E20]">
              Form Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {trackingData.forms.map((form, idx) => (
              <div
                key={`${form.sourceType}-${idx}`}
                className="flex justify-between text-sm text-gray-700"
              >
                <span className="capitalize">
                  {form.sourceType.replace(/_/g, " ")}
                </span>
                <span className="capitalize text-gray-600">
                  {form.status?.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {trackingData?.activities && trackingData.activities.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="py-4 px-5 border-b bg-[#FAFFF9]">
            <CardTitle className="text-base font-medium text-[#1B5E20]">
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {trackingData.activities.map((activity, idx) => (
              <div key={`${activity.title}-${idx}`} className="text-sm">
                <div className="font-medium text-gray-800">
                  {activity.title}
                </div>
                <div className="text-xs text-gray-500">
                  {activity.userAccount?.name || "System"} •{" "}
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
                {activity.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {activity.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
