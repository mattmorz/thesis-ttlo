import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ApplicationFormsCard } from "./ApplicationFormsCard";

interface Props {
  applicationId: string;
  viewMode: "grid" | "list";
}

// Available forms array
const FORMS = [
  {
    id: "client-profile",
    label: "Client Profile",
    color: "blue",
    formType: "client_profile" as const,
  },
  {
    id: "ip-disclosure",
    label: "IP Disclosure",
    color: "purple",
    formType: "ip_disclosure" as const,
  },
  {
    id: "deed-of-assignment",
    label: "Deed of Assignment",
    color: "green",
    formType: "deed_of_assignment" as const,
  },
  {
    id: "certificate-of-substantial-use",
    label: "Certificate of Substantial Use",
    color: "amber",
    formType: "substantial_use" as const,
  }
];

// Tab component that uses the card component
export function ApplicationFormsTab({ applicationId, viewMode }: Props) {
  return (
    <TabsContent value="application-forms">
      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid" && "grid-cols-1 md:grid-cols-2"
        )}
      >
        {FORMS.map((form) => (
          <ApplicationFormsCard
            key={form.id}
            applicationId={applicationId}
            title={form.label}
            color={form.color}
            formType={form.formType}
          />
        ))}
      </div>
    </TabsContent>
  );
}