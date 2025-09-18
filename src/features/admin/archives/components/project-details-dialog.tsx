"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { FileUploader } from "@/components/ui/fileupload";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ArchivedForm {
  id: string;
  projectId: string;
  projectTitle: string;
  inventors: string[];
  formType: string;
  fileName: string;
  uploadDate: string;
  fileSize: string;
  fileUrl: string;
  description: string;
  status: "uploaded" | "pending";
}

interface ProjectDetailsDialogProps {
  project: ArchivedForm | null;
  onClose: () => void;
  onUpload: (
    projectId: string,
    files: File[],
    description: string,
    formType: string
  ) => void;
}

const FORM_TYPES = {
  standard: [
    { value: "IP Disclosure", label: "IP Disclosure" },
    { value: "Patent", label: "Patent" },
    { value: "Copyright", label: "Copyright" },
    { value: "Trademark", label: "Trademark" },
  ],
  other: "other",
};

export function ProjectDetailsDialog({
  project,
  onClose,
  onUpload,
}: ProjectDetailsDialogProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [formType, setFormType] = useState("");
  const [customFormType, setCustomFormType] = useState("");
  const [isOtherType, setIsOtherType] = useState(false);

  if (!project) return null;

  const handleFormTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === FORM_TYPES.other) {
      setIsOtherType(true);
      setFormType("");
    } else {
      setIsOtherType(false);
      setFormType(value);
      setCustomFormType("");
    }
  };

  const handleUpload = () => {
    const finalFormType = isOtherType ? customFormType : formType;
    onUpload(project.projectId, files, description, finalFormType);
    setFiles([]);
    setDescription("");
    setFormType("");
    setCustomFormType("");
    setIsOtherType(false);
    setShowUploader(false);
  };

  return (
    <Dialog open={!!project} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Project Details - {project.projectId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Project Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploader(!showUploader)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Document
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p>{project.projectTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventors</p>
                <p>{project.inventors.join(", ")}</p>
              </div>
            </div>
          </div>

          {showUploader && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-2">
                <Label>Form Type</Label>
                <select
                  className="w-full p-2 border rounded-md mb-2"
                  value={isOtherType ? FORM_TYPES.other : formType}
                  onChange={handleFormTypeChange}
                >
                  <option value="">Select form type</option>
                  {FORM_TYPES.standard.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                  <option value={FORM_TYPES.other}>Other</option>
                </select>

                {isOtherType && (
                  <Input
                    placeholder="Enter document type..."
                    value={customFormType}
                    onChange={(e) => setCustomFormType(e.target.value)}
                    className="mt-2"
                  />
                )}

                <FileUploader
                  value={files}
                  onValueChange={setFiles}
                  dropzoneOptions={{
                    maxSize: 10 * 1024 * 1024,
                    accept: {
                      "application/pdf": [".pdf"],
                      "application/msword": [".doc"],
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        [".docx"],
                      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                    },
                  }}
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p>Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      Supports: PDF, DOC, DOCX, PNG, JPG, JPEG, GIF (Max 10MB)
                    </p>
                  </div>
                </FileUploader>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter document description..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploader(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || !formType || !description}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Uploaded Documents</h3>
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <FileText className="h-4 w-4" />
              <span>{project.fileName}</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {project.fileSize}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm">{project.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
