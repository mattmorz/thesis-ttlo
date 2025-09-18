import { AlertCircle, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Server-side static skeleton for the form status section
 * This component renders a static HTML structure that matches
 * the client component structure to prevent hydration errors
 */
export function FormStatusSkeleton() {
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-700 text-sm">
          Form Completion Status
        </h3>

        {/* Submit button - always disabled on server */}
        <Button
          disabled={true}
          size="sm"
          className="gap-1 bg-muted text-muted-foreground cursor-not-allowed"
        >
          <SendHorizonal className="h-3.5 w-3.5" />
          Submit Application
        </Button>
      </div>

      {/* Static form status grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Client Profile - skeleton */}
        <div className="flex items-center gap-2 p-2 rounded border bg-amber-50 border-amber-100">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-amber-800">
                Client Profile
              </h4>
              <div className="invisible h-6 w-16"></div>{" "}
              {/* Placeholder for button */}
            </div>
            <p className="text-xs text-amber-700">Loading...</p>
          </div>
        </div>

        {/* IP Disclosure - skeleton */}
        <div className="flex items-center gap-2 p-2 rounded border bg-amber-50 border-amber-100">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-amber-800">
                IP Disclosure
              </h4>
              <div className="invisible h-6 w-16"></div>{" "}
              {/* Placeholder for button */}
            </div>
            <p className="text-xs text-amber-700">Loading...</p>
          </div>
        </div>

        {/* Substantial Use - skeleton */}
        <div className="flex items-center gap-2 p-2 rounded border bg-amber-50 border-amber-100">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-amber-800">
                Substantial Use
              </h4>
              <div className="invisible h-6 w-16"></div>{" "}
              {/* Placeholder for button */}
            </div>
            <p className="text-xs text-amber-700">Loading...</p>
          </div>
        </div>

        {/* Deed of Assignment - skeleton */}
        <div className="flex items-center gap-2 p-2 rounded border bg-amber-50 border-amber-100">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-amber-800">
                Deed of Assignment
              </h4>
              <div className="invisible h-6 w-16"></div>{" "}
              {/* Placeholder for button */}
            </div>
            <p className="text-xs text-amber-700">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
