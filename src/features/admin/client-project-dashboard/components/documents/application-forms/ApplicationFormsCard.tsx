import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Card component props
interface Props {
  applicationId: string;
  title: string;
  description?: string;
  color: string;
  formType: "client_profile" | "substantial_use" | "deed_of_assignment" | "ip_disclosure";
}

// Form card component
export function ApplicationFormsCard({
  applicationId,
  title,
  description,
  color,
  formType,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownload = async () => {
    if (!applicationId) {
      toast.error("Missing application ID");
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading(`Preparing ${title}...`);
    
    try {
      console.log(`Generating ${formType} document for application ${applicationId}`);
      
      // Determine which form generator to use based on formType
      switch (formType) {
        case "client_profile":
          await generateClientProfile(applicationId);
          break;
        case "substantial_use":
          await generateSubstantialUse(applicationId);
          break;
        case "deed_of_assignment":
          await generateDeedOfAssignment(applicationId);
          break;
        case "ip_disclosure":
          await generateIpDisclosure(applicationId);
          break;
        default:
          throw new Error(`Unknown form type: ${formType}`);
      }
      
      toast.dismiss(toastId);
      toast.success("Document generated successfully");
    } catch (error) {
      console.error(`Error generating ${formType} document:`, error);
      toast.dismiss(toastId);
      toast.error(`Failed to generate ${title}`, {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Client Profile PDF generator
  const generateClientProfile = async (applicationId: string) => {
    try {
      console.log(`Fetching client profile data for application ${applicationId}`);
      
      const { default: generateClientProfilePdf } = await import(
        "@/app/(admin)/admin/forms-page/forms/ClientProfilePdf"
      );
      
      await generateClientProfilePdf(applicationId);
    } catch (error) {
      console.error("Error in generateClientProfile:", error);
      throw error;
    }
  };
  
  // Substantial Use PDF generator
  const generateSubstantialUse = async (applicationId: string) => {
    try {
      console.log(`Fetching substantial use data for application ${applicationId}`);
      
      const { default: generateSubstantialUsePdf } = await import(
        "@/app/(admin)/admin/forms-page/forms/SubstantialUsePdf"
      );
      
      await generateSubstantialUsePdf(applicationId);
    } catch (error) {
      console.error("Error in generateSubstantialUse:", error);
      throw error;
    }
  };
  
  // Deed of Assignment PDF generator
  const generateDeedOfAssignment = async (applicationId: string) => {
    try {
      console.log(`Fetching deed of assignment data for application ${applicationId}`);
      
      const { default: generateDeedOfAssignmentPdf } = await import(
        "@/app/(admin)/admin/forms-page/forms/DeedofAssignmentPdf"
      );
      
      await generateDeedOfAssignmentPdf(applicationId);
    } catch (error) {
      console.error("Error in generateDeedOfAssignment:", error);
      throw error;
    }
  };
  
  // IP Disclosure PDF generator
  const generateIpDisclosure = async (applicationId: string) => {
    try {
      console.log(`Fetching IP disclosure data for application ${applicationId}`);
      
      const { default: generateIpDisclosurePdf } = await import(
        "@/app/(admin)/admin/forms-page/forms/IPDisclosurePdf"
      );
      
      await generateIpDisclosurePdf(applicationId);
    } catch (error) {
      console.error("Error in generateIpDisclosure:", error);
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>{title}</CardTitle>
        <div className={cn("rounded-full p-2", `bg-${color}-50`)}>
          <FileText className={cn("h-6 w-6", `text-${color}-600`)} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        {description && <p className="text-sm text-gray-500">{description}</p>}
        <Button 
          onClick={handleDownload} 
          disabled={isLoading}
          title={`Download ${formType.replace(/_/g, ' ')} document`}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          {isLoading ? (
            "Generating..."
          ) : (
            <>
              <Download className="mr-2 h-4 w-4 text-gray-500" />
              Download
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}