"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/fileupload";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Project {
  id: string;
  title: string;
  inventors: string[];
}

interface ArchiveUploaderProps {
  projects: Project[];
  onUpload: (
    projectId: string,
    files: File[],
    description: string,
    formType: string
  ) => Promise<boolean>;
}

export function ArchiveUploader({ projects, onUpload }: ArchiveUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [formType, setFormType] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedProject) return;

    setIsUploading(true);
    try {
      const success = await onUpload(
        selectedProject.id,
        files,
        description,
        formType
      );
      if (success) {
        setFiles([]);
        setDescription("");
        setFormType("");
        setSelectedProject(null);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Upload Forms</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Forms</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Project</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedProject
                    ? selectedProject.title
                    : "Select a project..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search projects..." />
                  <CommandEmpty>No project found.</CommandEmpty>
                  <CommandGroup>
                    {projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        onSelect={() => {
                          setSelectedProject(project);
                          setSearchOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span>{project.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {project.inventors.join(", ")}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedProject && (
            <>
              <div className="space-y-2">
                <Label>Form Type</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                >
                  <option value="">Select form type</option>
                  <option value="IP Disclosure">IP Disclosure</option>
                  <option value="Patent">Patent</option>
                  <option value="Copyright">Copyright</option>
                  <option value="Trademark">Trademark</option>
                </select>
              </div>

              <FileUploader
                children={<></>}
                value={files}
                onValueChange={setFiles}
                dropzoneOptions={{
                  maxSize: 10 * 1024 * 1024,
                  accept: {
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                      [".docx"],
                  },
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description of the uploaded file..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                !selectedProject ||
                files.length === 0 ||
                !formType ||
                !description ||
                isUploading
              }
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
