import { Alert, AlertDescription } from "@/components/ui/alert";
import { TypographyH2 } from "@/components/ui/typography";
import { ArchivesContent } from "@/features/admin/archives/components/archives-content";
import { Info } from "lucide-react";

export default function ArchivesPage() {
  return (
    <main className="space-y-4 p-8 pt-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <TypographyH2>Archives</TypographyH2>
          <p className="text-muted-foreground">
            View and manage archived intellectual property projects
          </p>
        </div>
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          Browse archived projects, view their details, and unarchive them if
          needed. Use filters to narrow down your search.
        </AlertDescription>
      </Alert>
      <ArchivesContent />
    </main>
  );
}
