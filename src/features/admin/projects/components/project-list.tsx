import { Card, CardContent } from "@/components/ui/card";
import ProjectCards from "./project-cards";
import { ProjectsGetResult } from "../types";
import { EmptyData } from "@/components/global/empty-data";

interface ProjectsListProps {
  projects: ProjectsGetResult[];
  myProjects?: boolean;
}

export default function ProjectList({
  projects,
  myProjects = false,
}: ProjectsListProps) {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        {projects.length === 0 ? (
          <EmptyData text="No projects..." />
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCards
                key={project.id}
                project={project}
                myProject={myProjects}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
