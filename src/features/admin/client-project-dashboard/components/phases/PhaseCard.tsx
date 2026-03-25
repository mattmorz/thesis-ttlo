import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate, underscoreToSpace } from "@/lib/utils";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { memo, useEffect } from "react";
import usePhaseActionStore from "../../hooks/usePhasesActions";
import usePhasesStats from "../../hooks/usePhasesStats";
import { ApplicationPhase, PhaseStatus } from "../../types";

interface PhaseCardProps {
  phase: ApplicationPhase;
  index: number;
}

export const PhaseCard = memo(function PhaseCard({
  phase,
  index,
}: PhaseCardProps) {
  const { selectedPhaseId, setSelectedPhaseId } = usePhaseActionStore();

  const { totalTasks, completedTasks, completionPercentage, upcomingTasks } =
    usePhasesStats(phase.phaseTasks ?? []);

  useEffect(() => {
    if (!selectedPhaseId && index === 0) {
      setSelectedPhaseId(phase.phaseId);
    }
  }, [phase, setSelectedPhaseId, selectedPhaseId, index]);

  return (
    <Card
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-colors relative",
        selectedPhaseId === phase.phaseId.toString() && "border-primary"
      )}
      onClick={() => setSelectedPhaseId(phase.phaseId.toString())}
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">{phase.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={phase.status as Exclude<PhaseStatus, "all">}
              className={cn("capitalize")}
            >
              {underscoreToSpace(phase.status)}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(phase.startDate, "MMM d")}</span>
            <span className="text-muted-foreground">→</span>
            <span>{formatDate(phase.endDate, "MMM d")}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <div className="flex items-center gap-2">
                <span>{completionPercentage}%</span>
                <span className="text-xs text-muted-foreground">
                  ({completedTasks}/{totalTasks})
                </span>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
F              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  {completedTasks}/{totalTasks} tasks
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{upcomingTasks} upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
