import SearchWithNuqs from "@/components/global/search-with-nuqs";
import { Badge } from "@/components/ui/badge";
import { ArchiveProjectDialog } from "@/features/admin/projects/components/ArchiveProjectDialog";
import { underscoreToSpace } from "@/lib/utils";
import { format } from "date-fns";
import { Building2, FileText, Info, Users } from "lucide-react";
import { ClientProject } from "../../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { UnarchiveProjectDialog } from "@/features/admin/projects/components/UnarchiveProjectDialog";

interface ProjectHeaderProps {
  project: ClientProject;
  isArchived?: boolean;
  archiveReason?: string;
}

export function ProjectHeader({
  project,
  isArchived,
  archiveReason,
}: ProjectHeaderProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <CardTitle className="text-2xl font-semibold">
              {project?.title}
            </CardTitle>
            <Badge variant="secondary" className="capitalize">
              {underscoreToSpace(project?.status)}
            </Badge>
          </div>
          <CardDescription>
            <span className="capitalize">
              {underscoreToSpace(project?.ipType)}
            </span>{" "}
            • ID: {project?.id}
          </CardDescription>
        </div>
        {isArchived ? (
          <UnarchiveProjectDialog projectId={project?.id ?? ""} />
        ) : (
          <ArchiveProjectDialog projectId={project?.id ?? ""} />
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          <div className="w-full inline-flex items-center justify-center">
            <SearchWithNuqs
              placeholder="Search phases, task, or documents..."
              wrapperClassName="w-full max-w-md"
            />
          </div>
          <div className="space-y-1 inline-flex gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="size-4 mr-2" />
                Application Date
              </div>
              <p className="text-sm font-medium">
                {format(
                  new Date(project?.createdAt || new Date()),
                  "MMM d, yyyy"
                )}
              </p>
            </div>
            {isArchived && (
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="size-4 mr-2" />
                  Archive Reason
                </div>
                <p className="text-sm font-medium">{archiveReason}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
