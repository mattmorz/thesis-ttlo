import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InternalValidationForm } from "./InternalValidationForm";
import { trpc } from "@/trpc/client";
import { ExternalCollaborationForm } from "./ExternalCollaborationForm";
import { LoadingSpinner } from "@/components/global/loading-spinner";

interface Props {
  phaseId: string;
  applicationId: string;
  isArchived?: boolean;
}

export function DependencyTab({ phaseId, applicationId, isArchived }: Props) {
  const { data, isPending } =
    trpc.clientProjectDashboard.getInternalValidations.useQuery(phaseId);
  const { data: externalData, isPending: isExternalPending } =
    trpc.clientProjectDashboard.getExternalCollaborations.useQuery(phaseId);
  if (isPending || isExternalPending) {
    return (
      <div className="w-full h-64 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <Tabs defaultValue="internal" className="w-full">
      <TabsList className="w-full h-auto rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="internal"
          className="flex-1 data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Internal Validations
        </TabsTrigger>
        <TabsTrigger
          value="external"
          className="flex-1 data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          External Collaborations
        </TabsTrigger>
      </TabsList>
      <TabsContent value="internal">
        <InternalValidationForm
          isArchived={isArchived}
          phaseId={phaseId}
          applicationId={applicationId}
          initialData={data}
        />
      </TabsContent>
      <TabsContent value="external">
        <ExternalCollaborationForm
          isArchived={isArchived}
          phaseId={phaseId}
          applicationId={applicationId}
          initialData={externalData}
        />
      </TabsContent>
    </Tabs>
  );
}
