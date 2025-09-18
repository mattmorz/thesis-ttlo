"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFormUrl, FormTabs } from "./form-navigation";

/**
 * Example component demonstrating how to use the form navigation utilities
 * This can be used in any component that needs to link to specific forms
 */
export default function FormNavExample() {
  // Get the current formId from the route params
  const params = useParams();
  const formId = params.formId as string | undefined;

  return (
    <div className="space-y-4 p-6 border rounded-md">
      <h3 className="text-lg font-medium">Form Navigation Examples</h3>
      <p className="text-muted-foreground">
        Examples of how to navigate between different form tabs:
      </p>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={getFormUrl(undefined, FormTabs.CLIENT_PROFILE)}>
            Go to Client Profile
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link href={getFormUrl(undefined, FormTabs.IP_DISCLOSURE)}>
            Go to IP Disclosure
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link href={getFormUrl(undefined, FormTabs.SUBSTANTIAL_USE)}>
            Go to Substantial Use
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link href={getFormUrl(undefined, FormTabs.DEED_ASSIGNMENT)}>
            Go to Deed of Assignment
          </Link>
        </Button>
      </div>

      <div className="mt-4">
        <h4 className="font-medium">Usage in other components:</h4>
        <pre className="p-3 mt-2 bg-muted rounded-md overflow-x-auto text-sm">
          {`
// Example: Navigate to a specific form from any component
import { useRouter } from "next/navigation";
import { getFormUrl, FormTabs } from "./form-navigation";

function YourComponent() {
  const router = useRouter();

  const goToIPDisclosure = () => {
    router.push(getFormUrl(undefined, FormTabs.IP_DISCLOSURE));
  };

  return <button onClick={goToIPDisclosure}>Go to IP Disclosure</button>;
}
          `.trim()}
        </pre>
      </div>
    </div>
  );
}
