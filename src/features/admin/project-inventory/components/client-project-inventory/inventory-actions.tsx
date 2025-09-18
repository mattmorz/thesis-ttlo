"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { AddEntryForm } from "./add-entry-form";
import { type InventoryFormData } from "./schema";

// Type for the status property with all allowed values
type StatusType =
  | "For Application"
  | "On-going Application"
  | "Granted"
  | "Other"
  | "draft"
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "completed"
  | "archived";

// Type for IP Type with all allowed values
type IpType =
  | "patent"
  | "copyright"
  | "trademark"
  | "utility_model"
  | "industrial_design"
  | "trade_secret"
  | "not_sure"
  | "other";

// Type for Project Type with all allowed values
type ProjectType = "Research" | "Development" | "Consultation" | "Other";

// Type for Field with all allowed values
type FieldType = "Chemical" | "Mechanical" | "Software" | "Other";

// Type for Funding Source with all allowed values
type FundingSourceType =
  | "DOST"
  | "PCAARRD"
  | "CSU-funded"
  | "Private"
  | "Thesis"
  | "Other";

interface InventoryActionsProps {
  item: {
    id: string;
    userId?: string;
    title?: string; // For compatibility with BaseInventoryType
    projectTitle: string; // Matches the schema's projectTitle
    ipType: IpType; // Use proper type
    status: StatusType; // Use proper type
    inventors: { name: string; role?: string }[];
    startDate?: string;
    endDate?: string;
    fundingSource?: string;
  };
  onEdit: (data: Omit<InventoryFormData, "clientId"> & { id: string }) => void;
  onDelete: (id: string) => void;
  onAssignStaff: (id: string) => void;
  isAdmin?: boolean;
  isTTLOStaff?: boolean;
}

export function InventoryActions({
  item,
  onEdit,
  onDelete,
  onAssignStaff,
  isAdmin = false,
  isTTLOStaff = false,
}: InventoryActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Only admins can edit and delete
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canAssignStaff = isAdmin;

  // Convert item format for AddEntryForm defaultValues
  const getDefaultValues = () => {
    // Make sure fundingSource is one of the allowed values
    let fundingSource: FundingSourceType = "Other";
    if (
      item.fundingSource &&
      ["DOST", "PCAARRD", "CSU-funded", "Private", "Thesis", "Other"].includes(
        item.fundingSource
      )
    ) {
      fundingSource = item.fundingSource as FundingSourceType;
    }

    return {
      projectTitle: item.projectTitle,
      status: item.status as StatusType,
      ipType: item.ipType as IpType,
      inventors: item.inventors,
      startDate: item.startDate || "",
      endDate: item.endDate,
      fundingSource,
      // Add any other required fields with default values
      clientId: "",
      field: "Chemical" as FieldType,
      projectType: "Research" as ProjectType,
    };
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(canAssignStaff || isTTLOStaff) && (
            <DropdownMenuItem
              onClick={() => onAssignStaff(item.id)}
              className="gap-2 text-primary font-medium"
            >
              <Users className="h-4 w-4" />
              Manage Staff
            </DropdownMenuItem>
          )}

          {(canAssignStaff || isTTLOStaff) && canEdit && (
            <DropdownMenuSeparator />
          )}

          {canEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
          {!canEdit && !canDelete && !(canAssignStaff || isTTLOStaff) && (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">
                No actions available
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          <AddEntryForm
            onSubmit={(data) => {
              onEdit({ ...data, id: item.id });
              setShowEditDialog(false);
            }}
            defaultValues={getDefaultValues()}
            isEditing={true}
            isReadOnly={!canEdit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
