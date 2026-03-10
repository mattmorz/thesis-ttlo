import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="py-4 px-5 border-b bg-[#FAFFF9]">
        <CardTitle className="text-base font-medium text-[#1B5E20] flex items-center gap-2">
          Track your Application
        </CardTitle>
        <p className="text-sm text-gray-600 mb-4">
          Enter your application ID, email address and OTP code to track your
          intellectual property application status.
        </p>
      </CardHeader>
      <CardContent className="p-5">
        {/* Application ID */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application ID
          </label>
          <input
            type="text"
            placeholder="Enter Application ID"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600 outline-none"
          />
        </div>

        {/* Email Address with Send OTP button inline
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600 outline-none"
            />
            <button className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition text-sm">
              Send OTP
            </button>
          </div>
        </div>
        */}

        {/* OTP Code
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OTP Code
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-center tracking-widest text-lg focus:ring-2 focus:ring-green-600 outline-none"
          />
        </div>
        */}

        <Button
          variant="outline"
          className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] w-full text-sm h-10"
        >
          Track Application
        </Button>
      </CardContent>
    </Card>
  );
}
