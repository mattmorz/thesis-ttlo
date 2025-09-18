"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, Users, BadgeCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

interface ProjectEnrollment {
  enrollmentId: string;
  applicationId: string;
  userId: string;
  createdAt: string;
}

interface ProjectEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onClose: () => void;
}

// Mock fetch functions - replace with actual API calls
async function fetchEligibleUsers(): Promise<User[]> {
  // This would be an actual API call
  // Fetch users with 'admin' or 'ttlo_staff' roles
  try {
    const response = await fetch("/api/users?role=admin,ttlo_staff");
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  } catch (error) {
    console.error("Error fetching eligible users:", error);
    return []; // Return empty array on error
  }
}

async function fetchProjectEnrollments(
  projectId: string
): Promise<ProjectEnrollment[]> {
  // This would be an actual API call
  try {
    const response = await fetch(`/api/projects/${projectId}/enrollments`);
    if (!response.ok) throw new Error("Failed to fetch enrollments");
    return await response.json();
  } catch (error) {
    console.error("Error fetching project enrollments:", error);
    return []; // Return empty array on error
  }
}

async function enrollUsersToProject(
  projectId: string,
  userIds: string[]
): Promise<boolean> {
  // This would be an actual API call
  try {
    const response = await fetch(`/api/projects/${projectId}/enrollments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIds }),
    });

    if (!response.ok) throw new Error("Failed to enroll users");
    return true;
  } catch (error) {
    console.error("Error enrolling users:", error);
    return false;
  }
}

async function removeUserFromProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  // This would be an actual API call
  try {
    const response = await fetch(
      `/api/projects/${projectId}/enrollments/${userId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Failed to remove user");
    return true;
  } catch (error) {
    console.error("Error removing user:", error);
    return false;
  }
}

export function ProjectEnrollmentDialog({
  open,
  onOpenChange,
  project,
  onClose,
}: ProjectEnrollmentDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [enrolledUsers, setEnrolledUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch eligible users and current enrollments
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [usersData, enrollmentsData] = await Promise.all([
          fetchEligibleUsers(),
          fetchProjectEnrollments(project.id),
        ]);

        setUsers(usersData);
        const enrolledUserIds = enrollmentsData.map((e) => e.userId);
        setEnrolledUsers(enrolledUserIds);
        setSelectedUsers(enrolledUserIds);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load users and enrollments");
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchData();
    }
  }, [open, project.id]);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // Handle user selection
  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Save enrollments
  const handleSave = async () => {
    setSaving(true);
    try {
      // Users to add (selected but not already enrolled)
      const usersToAdd = selectedUsers.filter(
        (id) => !enrolledUsers.includes(id)
      );

      // Users to remove (enrolled but not selected)
      const usersToRemove = enrolledUsers.filter(
        (id) => !selectedUsers.includes(id)
      );

      // Perform enrollments
      if (usersToAdd.length > 0) {
        const success = await enrollUsersToProject(project.id, usersToAdd);
        if (success) {
          toast.success(`${usersToAdd.length} user(s) enrolled successfully`);
        }
      }

      // Perform removals
      for (const userId of usersToRemove) {
        const success = await removeUserFromProject(project.id, userId);
        if (success) {
          toast.success(`User removed from project`);
        }
      }

      onClose();
    } catch (error) {
      console.error("Error saving enrollments:", error);
      toast.error("Failed to update project enrollments");
    } finally {
      setSaving(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Manage Project Users
          </DialogTitle>
          <DialogDescription>
            Enroll admin and staff users to work on project:{" "}
            <Badge variant="outline" className="font-medium">
              {project.title}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email or role..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {selectedUsers.length} user(s) selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUsers(enrolledUsers)}
            disabled={loading || saving}
          >
            Reset
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-grow h-[340px] pr-4 mt-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Users className="h-8 w-8 mb-2" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-2 rounded-md ${
                    selectedUsers.includes(user.id)
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                      id={`user-${user.id}`}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex items-center flex-1 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8 mr-3">
                        {user.image ? (
                          <AvatarImage src={user.image} alt={user.name} />
                        ) : (
                          <AvatarFallback>
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {user.email}
                          {enrolledUsers.includes(user.id) && (
                            <BadgeCheck className="h-3 w-3 text-green-500" />
                          )}
                        </span>
                      </div>
                    </Label>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.role === "ttlo_staff" ? "Staff" : "Admin"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
