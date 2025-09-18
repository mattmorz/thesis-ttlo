"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Event } from "../../../../app/(admin)/admin/calendar/types";

interface Member {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface EditEventDialogProps {
  event: Event;
  onSave: (updatedEvent: Event) => void;
}

export function EditEventDialog({ event, onSave }: EditEventDialogProps) {
  const [editedEvent, setEditedEvent] = useState<Event>(event);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setEditedEvent(event);
    // Convert participants to Member format
    setSelectedMembers(
      event.participants?.map((name) => ({
        id: crypto.randomUUID(),
        name,
      })) || []
    );
  }, [event]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setTags([...tags, { id: crypto.randomUUID(), name: tagInput.trim() }]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const handleAddMember = () => {
    if (memberInput.trim()) {
      const newMembers = [
        ...selectedMembers,
        { id: crypto.randomUUID(), name: memberInput.trim() },
      ];
      setSelectedMembers(newMembers);
      setEditedEvent({
        ...editedEvent,
        participants: newMembers.map((m) => m.name),
      });
      setMemberInput("");
    }
  };

  const handleRemoveMember = (id: string) => {
    const newMembers = selectedMembers.filter((member) => member.id !== id);
    setSelectedMembers(newMembers);
    setEditedEvent({
      ...editedEvent,
      participants: newMembers.map((m) => m.name),
    });
  };

  const handleSave = () => {
    onSave(editedEvent);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedEvent.title}
              onChange={(e) =>
                setEditedEvent({ ...editedEvent, title: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Associated Project</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not Associated</SelectItem>
                <SelectItem value="project1">Client Project A</SelectItem>
                <SelectItem value="project2">Client Project B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Event Tags</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag.id)}
                >
                  {tag.name} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add tag (e.g., Meeting, Deadline, Review)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button type="button" onClick={handleAddTag}>
                Add
              </Button>
            </div>
          </div>

          <div>
            <Label>Members</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {selectedMembers.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  {member.name} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add member..."
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              />
              <Button type="button" onClick={handleAddMember}>
                Add
              </Button>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={editedEvent.description}
              onChange={(e) =>
                setEditedEvent({ ...editedEvent, description: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={editedEvent.status}
              onValueChange={(value: Event["status"]) =>
                setEditedEvent({ ...editedEvent, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="In-progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// TODO: Database Integration
