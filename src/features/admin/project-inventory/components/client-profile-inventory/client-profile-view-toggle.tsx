import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface ViewToggleProps {
  currentView: "table" | "grid";
  onViewChange: (view: "table" | "grid") => void;
}

/**
 * ViewToggle component for switching between table and grid views
 */
export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <TooltipProvider>
      <div className="flex border rounded-md overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-none border-0 h-9"
              onClick={() => onViewChange("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Table View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-none border-0 h-9"
              onClick={() => onViewChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Grid View</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
